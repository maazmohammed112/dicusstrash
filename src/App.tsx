import { NotFound } from './components/NotFound';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeDatabase } from './db/database';
import {
  getAllItems,
  getCollections,
  getAppSettings,
  addItem,
  updateItem,
  deleteItem,
  deleteMultipleItems,
  moveItemsToFolder,
  toggleFavorite,
  toggleArchive,
  addCollection,
  updateCollection,
  deleteCollection,
  saveAttachment,
  updateAppSettings,
  eraseEntireDatabase,
  findDuplicateUrl
} from './db/repository';
import type { SavedItem, Collection, AppSettings, ItemType } from './types/stash';
import { ToastProvider, useToast } from './components/ToastNotification';
import { ShareCollectionModal } from './components/ShareCollectionModal';
import { Header } from './components/Header';
import { FloatingNav, type ActiveTab } from './components/FloatingNav';
import { DesktopNav } from './components/DesktopNav';
import { QuickSaveBar } from './components/QuickSaveBar';
import { SavedItemCard } from './components/SavedItemCard';
import { CollectionCard } from './components/CollectionCard';
import { EmptyState } from './components/EmptyState';
import { SearchFilters, type CategoryFilter } from './components/SearchFilters';
import { AddSheet } from './components/AddSheet';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CollectionModal } from './components/CollectionModal';
import { SettingsModal } from './components/SettingsModal';
import { MoveFolderModal } from './components/MoveFolderModal';
import { BulkActionBar } from './components/BulkActionBar';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DuplicateNoticeModal } from './components/DuplicateNoticeModal';
import { shareSavedItem } from './services/shareService';
import { inspectUrl } from './services/platformDetector';
import { medianBridge } from './services/medianBridge';
import { Plus, ArrowRight, ArrowLeft, Link2, FileText, ListChecks, MapPin, Paperclip, ArrowUpRight, Share2 } from 'lucide-react';

export function StashApp() {
  const { showToast } = useToast();

  // Core Data
  const [items, setItems] = useState<SavedItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultFolderId: 'unsorted',
    showQuickEditOnShare: true,
    includeShareSignature: true,
    autoFetchPreviews: true,
    enableMotion: true
  });
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab, selectedCollectionId]);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('');
  useEffect(() => { setVisibleLimit(60); }, [activeTab, selectedCollectionId, searchQuery, categoryFilter, selectedFolderFilter, selectedPlatformFilter]);

  // Multi-select & Bulk actions
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Modals & Panels
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addInitialType, setAddInitialType] = useState<ItemType>('link');
  const [addInitialUrl, setAddInitialUrl] = useState('');

  const openAdd = (type: ItemType = 'link') => {
    setAddInitialType(type);
    setIsAddOpen(true);
  };

  const [detailItem, setDetailItem] = useState<SavedItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [sharingCollection, setSharingCollection] = useState<Collection | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<string[]>([]);

  // Confirmation Modals
  const [deleteItemTarget, setDeleteItemTarget] = useState<SavedItem | null>(null);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<Collection | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [duplicateModalInfo, setDuplicateModalInfo] = useState<{
    existingItem: SavedItem;
    incomingUrl: string;
  } | null>(null);

  // Load database on mount
  const refreshData = useCallback(async () => {
    try {
      const allItems = await getAllItems();
      const allCollections = await getCollections();
      const currentSettings = await getAppSettings();

      setItems(allItems);
      setCollections(allCollections);
      setSettings(currentSettings);
    } catch (e) {
      console.error('Error refreshing stash data:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await initializeDatabase();
      if (isMounted) {
        await refreshData();
        setIsDbReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshData]);

  // Median.co and PWA Share Listener
  useEffect(() => {
    if (!isDbReady) return;
    medianBridge.init();
    const unsubscribe = medianBridge.addListener(async (result) => {
      if (result.status === 'saved' && result.item) {
        await refreshData();
        showToast(result.savedCount && result.savedCount > 1 ? `Saved ${result.savedCount} links to Unsorted` : 'Saved to Unsorted', 'success');
        if (settings.showQuickEditOnShare) {
          setDetailItem(result.item);
        }
      } else if (result.status === 'duplicate' && result.existingItem) {
        setDuplicateModalInfo({
          existingItem: result.existingItem,
          incomingUrl: result.existingItem.originalUrl || ''
        });
      } else if (result.status === 'error') {
        showToast(result.message || 'Share intake failed.', 'error');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isDbReady, refreshData, showToast, settings.showQuickEditOnShare]);

  // Compute 5 Most Recent Items for Home Screen (EXACTLY 5 or fewer)
  const recentItems = useMemo(() => {
    return items
      .filter(item => !item.isArchived)
      .slice(0, 5);
  }, [items]);

  // Filtered items for Search tab & Collection Detail view
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by specific folder if currently viewing a single collection
    if (selectedCollectionId) {
      result = result.filter(item => item.folderId === selectedCollectionId && !item.isArchived);
    } else {
      // General filters
      if (categoryFilter === 'favorite') {
        result = result.filter(item => item.isFavorite && !item.isArchived);
      } else if (categoryFilter === 'archived') {
        result = result.filter(item => item.isArchived);
      } else {
        result = result.filter(item => !item.isArchived);
        if (categoryFilter !== 'all') {
          result = result.filter(item => item.type === categoryFilter);
        }
      }

      if (selectedFolderFilter) {
        result = result.filter(item => item.folderId === selectedFolderFilter);
      }
    }

    if (selectedPlatformFilter) {
      result = result.filter(item => item.platform === selectedPlatformFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return (
          item.title?.toLowerCase().includes(q) ||
          item.originalUrl?.toLowerCase().includes(q) ||
          item.note?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags?.some(tag => tag.toLowerCase().includes(q)) ||
          item.locationData?.placeName?.toLowerCase().includes(q) ||
          item.checklist?.some(c => c.text.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [
    items,
    selectedCollectionId,
    categoryFilter,
    selectedFolderFilter,
    selectedPlatformFilter,
    searchQuery
  ]);

  // Quick Save from Home Input
  const handleQuickSave = async (rawUrl: string) => {
    setIsLoadingSave(true);
    try {
      const urlInfo = await inspectUrl(rawUrl);
      const normalized = urlInfo.normalizedUrl;

      // Duplicate check
      const duplicate = await findDuplicateUrl(normalized);
      if (duplicate) {
        setDuplicateModalInfo({
          existingItem: duplicate,
          incomingUrl: rawUrl
        });
        return;
      }

      await addItem({
        type: 'link',
        originalUrl: urlInfo.rawUrl,
        normalizedUrl: normalized,
        title: urlInfo.derivedTitle,
        platform: urlInfo.platform,
        sourceHost: urlInfo.sourceHost,
        thumbnailUrl: urlInfo.thumbnailUrl || urlInfo.faviconUrl,
        metadataStatus: urlInfo.thumbnailUrl ? 'success' : 'fallback',
        folderId: 'unsorted',
        tags: [],
        isFavorite: false,
        isArchived: false
      });

      await refreshData();
      showToast('Saved to your stash!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save link', 'error');
    } finally {
      setIsLoadingSave(false);
    }
  };

  // Add Item actions from AddSheet
  const handleSaveLink = async (data: {
    url: string;
    title: string;
    note?: string;
    folderId: string;
    thumbnailUrl?: string;
  }) => {
    const urlInfo = await inspectUrl(data.url);
    const normalized = urlInfo.normalizedUrl;

    const duplicate = await findDuplicateUrl(normalized);
    if (duplicate) {
      setDuplicateModalInfo({
        existingItem: duplicate,
        incomingUrl: data.url
      });
      return;
    }

    await addItem({
      type: 'link',
      originalUrl: urlInfo.rawUrl,
      normalizedUrl: normalized,
      title: data.title || urlInfo.derivedTitle,
      note: data.note,
      platform: urlInfo.platform,
      sourceHost: urlInfo.sourceHost,
      thumbnailUrl: data.thumbnailUrl || urlInfo.thumbnailUrl || urlInfo.faviconUrl,
      metadataStatus: (data.thumbnailUrl || urlInfo.thumbnailUrl) ? 'success' : 'fallback',
      folderId: data.folderId,
      tags: [],
      isFavorite: false,
      isArchived: false
    });

    await refreshData();
    showToast('Link saved to stash', 'success');
  };

  const handleSaveNote = async (data: {
    title: string;
    note: string;
    tags: string[];
    folderId: string;
  }) => {
    await addItem({
      type: 'note',
      title: data.title,
      note: data.note,
      platform: 'note',
      folderId: data.folderId,
      tags: data.tags,
      isFavorite: false,
      isArchived: false
    });

    await refreshData();
    showToast('Note created', 'success');
  };

  const handleSaveChecklist = async (data: {
    title: string;
    checklist: any[];
    folderId: string;
  }) => {
    await addItem({
      type: 'checklist',
      title: data.title,
      platform: 'checklist',
      checklist: data.checklist,
      folderId: data.folderId,
      tags: [],
      isFavorite: false,
      isArchived: false
    });

    await refreshData();
    showToast('Checklist created', 'success');
  };

  const handleSaveLocation = async (data: {
    placeName: string;
    mapsUrl?: string;
    address?: string;
    note?: string;
    folderId: string;
  }) => {
    await addItem({
      type: 'location',
      title: data.placeName,
      platform: 'maps',
      locationData: {
        placeName: data.placeName,
        mapsUrl: data.mapsUrl,
        address: data.address
      },
      note: data.note,
      folderId: data.folderId,
      tags: [],
      isFavorite: false,
      isArchived: false
    });

    await refreshData();
    showToast('Location saved', 'success');
  };

  const handleSaveFile = async (file: File, folderId: string, note?: string) => {
    const newRecord = await addItem({
      type: 'file',
      title: file.name,
      platform: 'file',
      note,
      folderId,
      tags: [],
      isFavorite: false,
      isArchived: false
    });

    try {
      await saveAttachment(newRecord.id, file);
    } catch (error) {
      await deleteItem(newRecord.id);
      throw error;
    }
    await refreshData();
    showToast('File stored in stash', 'success');
  };

  // Item interaction handlers
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard', 'success');
  };

  const handleShare = async (item: SavedItem) => {
    const res = await shareSavedItem(item);
    if (res.method === 'clipboard' && res.success) {
      showToast('Share message copied to clipboard', 'success');
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFav = await toggleFavorite(id);
    await refreshData();
    if (detailItem && detailItem.id === id) {
      setDetailItem(prev => prev ? { ...prev, isFavorite: isFav } : null);
    }
    showToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'info');
  };

  const handleToggleArchive = async (id: string) => {
    const isArchived = await toggleArchive(id);
    await refreshData();
    if (detailItem && detailItem.id === id) {
      setDetailItem(prev => prev ? { ...prev, isArchived } : null);
    }
    showToast(isArchived ? 'Item archived' : 'Item restored', 'info');
  };

  const handleUpdateItem = async (id: string, updates: Partial<SavedItem>) => {
    const updated = await updateItem(id, updates);
    await refreshData();
    if (detailItem && detailItem.id === id && updated) {
      setDetailItem(updated);
    }
    showToast('Changes saved', 'success');
  };

  const handleRefreshPreview = async (item: SavedItem) => {
    if (!item.originalUrl) return;
    try {
      const info = await inspectUrl(item.originalUrl);
      const updates: Partial<SavedItem> = {
        thumbnailUrl: info.thumbnailUrl || info.faviconUrl,
        metadataStatus: info.thumbnailUrl ? 'success' : 'fallback'
      };
      if (info.derivedTitle && item.title === 'Saved Link') {
        updates.title = info.derivedTitle;
      }
      await updateItem(item.id, updates);
      await refreshData();
      if (detailItem && detailItem.id === item.id) {
        setDetailItem(prev => prev ? { ...prev, ...updates } : null);
      }
      showToast('Preview refreshed', 'success');
    } catch {
      showToast('Could not refresh preview', 'info');
    }
  };

  // Multi-select & Bulk Actions
  const toggleSelectItemId = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkMove = () => {
    if (selectedItemIds.size === 0) return;
    setItemsToMove(Array.from(selectedItemIds));
    setIsMoveModalOpen(true);
  };

  const handleBulkArchive = async () => {
    if (selectedItemIds.size === 0) return;
    for (const id of Array.from(selectedItemIds)) {
      await toggleArchive(id);
    }
    setSelectedItemIds(new Set());
    setIsSelectionMode(false);
    await refreshData();
    showToast('Selected items archived', 'success');
  };

  const handleBulkDelete = () => {
    if (selectedItemIds.size === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    await deleteMultipleItems(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
    setIsSelectionMode(false);
    setIsBulkDeleteConfirmOpen(false);
    await refreshData();
    showToast('Items removed from stash', 'success');
  };

  // Collection management
  const handleSaveCollection = async (data: {
    name: string;
    description?: string;
    color: string;
    icon: string;
  }) => {
    if (editingCollection) {
      await updateCollection(editingCollection.id, data);
      showToast('Collection updated', 'success');
    } else {
      await addCollection(data);
      showToast('Collection created', 'success');
    }
    await refreshData();
  };

  const handleDeleteCollection = async (mode: 'move-to-unsorted' | 'delete-all') => {
    if (!deleteCollectionTarget) return;
    try {
      await deleteCollection(deleteCollectionTarget.id, mode);
      setDeleteCollectionTarget(null);
      if (selectedCollectionId === deleteCollectionTarget.id) {
        setSelectedCollectionId(null);
      }
      await refreshData();
      showToast('Collection deleted', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleEraseAll = async () => {
    await eraseEntireDatabase();
    await refreshData();
    showToast('Vault erased and reset to fresh state.', 'info');
  };

  // Quick collection item counter map
  const collectionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      if (!item.isArchived) {
        map[item.folderId] = (map[item.folderId] || 0) + 1;
      }
    }
    return map;
  }, [items]);

  const activeCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find(c => c.id === selectedCollectionId) || null;
  }, [collections, selectedCollectionId]);

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-[#FFF9EA] text-[#151515] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#151515] text-[#FFD76D] flex items-center justify-center mb-3 shadow-md animate-pulse">
          <span className="font-extrabold text-lg">/</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#151515]">discuss/stash</h1>
        <p className="font-handwritten text-sm text-[#77736C] mt-1">loading your local vault...</p>
      </div>
    );
  }

  return (
    <div className={`stash-app min-h-screen flex flex-col antialiased ${settings.enableMotion ? "" : "motion-disabled"}`}>
      {/* Desktop Navigation Sidebar */}
      <DesktopNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedCollectionId(null);
          setActiveTab(tab);
        }}
        onOpenAdd={() => openAdd('link')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        itemCount={items.length}
      />

      {/* Main Content Viewport */}
      <main className="app-main flex-1 flex flex-col min-w-0 w-full">
        {/* Top Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAdd={() => setIsAddOpen(true)}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={() => {
            setIsSelectionMode(!isSelectionMode);
            if (isSelectionMode) setSelectedItemIds(new Set());
          }}
        />

        {/* =========================================================================
            TAB 1: HOME SCREEN
           ========================================================================= */}
        {activeTab === 'home' && !selectedCollectionId && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="vault-hero">
              <div className="hero-copy">
                <span className="eyebrow">GOOD DAY / YOUR PRIVATE VAULT</span>
                <h2>Your little corner<br />of the <span className="hero-underline">internet.</span></h2>
              </div>
              <div className="hero-aside">
                <span className="handwritten-note">Save anything.<br />Find everything.</span>
                <ArrowUpRight size={38} strokeWidth={1} aria-hidden="true" />
                <span className="hero-local-label">Your ideas. All in one place.</span>
              </div>
            </div>
            <div className="capture-row">
              <div className="capture-label"><Link2 size={18} /><span>Something worth keeping?</span></div>
              <QuickSaveBar onSaveUrl={handleQuickSave} isLoading={isLoadingSave} />
            </div>
            <div className="quick-create-grid" aria-label="Create a saved item">
              {([{ type: 'link', label: 'Save a link', icon: Link2 }, { type: 'note', label: 'Write a note', icon: FileText }, { type: 'checklist', label: 'Make a checklist', icon: ListChecks }, { type: 'location', label: 'Keep a place', icon: MapPin }, { type: 'file', label: 'Store a file', icon: Paperclip }] as const).map(({ type, label, icon: Icon }, index) => (
                <button key={type} className={`quick-create quick-create-${type}`} onClick={() => openAdd(type)}>
                  <span className="quick-create-top"><Icon size={23} /><span className="quick-create-number">0{index + 1}</span></span>
                  <span className="quick-create-bottom">{label}<ArrowUpRight size={19} /></span>
                </button>
              ))}
            </div>

            {/* Empty State if library has zero items */}
            {items.length === 0 ? (
              <EmptyState
                onAddLink={() => setIsAddOpen(true)}
                onCreateCollection={() => {
                  setEditingCollection(null);
                  setIsCollectionModalOpen(true);
                }}
              />
            ) : (
              <>
                {/* RECENTLY SAVED SECTION: EXACTLY 5 Most Recent Items */}
                <section className="library-section">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#151515] tracking-tight">
                        Recently Saved
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F6EDCF] text-[#77736C]">
                        {recentItems.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('search')}
                      className="text-xs font-bold text-[#151515] hover:text-[#F2755B] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View All</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="item-grid">
                    {recentItems.map(item => {
                      const col = collections.find(c => c.id === item.folderId);
                      return (
                        <SavedItemCard
                          key={item.id}
                          item={item}
                          collectionName={col?.name || 'Unsorted'}
                          collectionColor={col?.color || '#F6EDCF'}
                          isSelected={selectedItemIds.has(item.id)}
                          isSelectionMode={isSelectionMode}
                          onSelect={toggleSelectItemId}
                          onClick={(i) => setDetailItem(i)}
                          onCopy={handleCopy}
                          onToggleFavorite={handleToggleFavorite}
                          onMove={(i) => {
                            setItemsToMove([i.id]);
                            setIsMoveModalOpen(true);
                          }}
                          onShare={handleShare}
                          onToggleArchive={handleToggleArchive}
                          onDelete={(i) => setDeleteItemTarget(i)}
                        />
                      );
                    })}
                  </div>
                </section>

                {/* COLLECTIONS ORGANIC GRID */}
                <section className="library-section pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-[#151515] tracking-tight">
                      Collections
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCollection(null);
                        setIsCollectionModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#151515] hover:text-[#F2755B] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus size={14} />
                      <span>New Collection</span>
                    </button>
                  </div>

                  <div className="collection-grid">
                    {collections.map(col => (
                      <CollectionCard
                        key={col.id}
                        collection={col}
                        onShare={setSharingCollection}
                        itemCount={collectionCounts[col.id] || 0}
                        onClick={(c) => setSelectedCollectionId(c.id)}
                        onEdit={(c) => {
                          setEditingCollection(c);
                          setIsCollectionModalOpen(true);
                        }}
                        onDelete={(c) => setDeleteCollectionTarget(c)}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: SEARCH & FILTER VIEW
           ========================================================================= */}
        {activeTab === 'search' && !selectedCollectionId && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#151515] tracking-tight">
                Search & Filter
              </h2>
              <p className="text-xs text-[#77736C] mt-1">
                Instant offline search across your entire vault
              </p>
            </div>

            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={categoryFilter}
              onFilterChange={setCategoryFilter}
              collections={collections}
              selectedFolderId={selectedFolderFilter}
              onFolderChange={setSelectedFolderFilter}
              selectedPlatform={selectedPlatformFilter}
              onPlatformChange={setSelectedPlatformFilter}
            />

            {/* Results Header */}
            <div className="flex items-center justify-between text-xs text-[#77736C]">
              <span>
                Showing <strong className="text-[#151515]">{filteredItems.length}</strong> items
              </span>
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#FFFEF7] border border-[rgba(21,21,21,0.06)]">
                <span className="font-handwritten text-lg font-bold text-[#77736C] block mb-1">
                  nothing matched
                </span>
                <p className="text-sm font-semibold text-[#151515]">
                  No items found matching your filters.
                </p>
              </div>
            ) : (
              <div className="item-grid">
                {filteredItems.slice(0, visibleLimit).map(item => {
                  const col = collections.find(c => c.id === item.folderId);
                  return (
                    <SavedItemCard
                      key={item.id}
                      item={item}
                      collectionName={col?.name || 'Unsorted'}
                      collectionColor={col?.color || '#F6EDCF'}
                      isSelected={selectedItemIds.has(item.id)}
                      isSelectionMode={isSelectionMode}
                      onSelect={toggleSelectItemId}
                      onClick={(i) => setDetailItem(i)}
                      onCopy={handleCopy}
                      onToggleFavorite={handleToggleFavorite}
                      onMove={(i) => {
                        setItemsToMove([i.id]);
                        setIsMoveModalOpen(true);
                      }}
                      onShare={handleShare}
                      onToggleArchive={handleToggleArchive}
                      onDelete={(i) => setDeleteItemTarget(i)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: COLLECTIONS OVERVIEW
           ========================================================================= */}
        {activeTab === 'collections' && !selectedCollectionId && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#151515] tracking-tight">
                  Collections
                </h2>
                <p className="text-xs text-[#77736C] mt-1">
                  Organize your links, ideas, and places into custom vaults
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCollection(null);
                  setIsCollectionModalOpen(true);
                }}
                className="pill-btn pill-btn-black text-xs py-2 px-4 shadow-sm"
              >
                <Plus size={14} />
                <span>New Collection</span>
              </button>
            </div>

            <div className="collection-grid">
              {collections.map(col => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  onShare={setSharingCollection}
                  itemCount={collectionCounts[col.id] || 0}
                  onClick={(c) => setSelectedCollectionId(c.id)}
                  onEdit={(c) => {
                    setEditingCollection(c);
                    setIsCollectionModalOpen(true);
                  }}
                  onDelete={(c) => setDeleteCollectionTarget(c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SINGLE COLLECTION DETAIL VIEW
           ========================================================================= */}
        {selectedCollectionId && activeCollection && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Collection Header */}
            <div
              className="p-6 sm:p-8 rounded-[32px] border border-[rgba(21,21,21,0.08)] shadow-sm"
              style={{ backgroundColor: activeCollection.color || '#F6EDCF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedCollectionId(null)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFEF7] text-xs font-bold text-[#151515] hover:bg-white shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={14} /> All Collections
                </button>

                <span className="text-xs font-bold text-[rgba(21,21,21,0.7)]">
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151515] tracking-tight">
                {activeCollection.name}
              </h2>
              <button className="pill-btn empty-secondary mt-4" onClick={() => setSharingCollection(activeCollection)}><Share2 size={16} />Share all links</button>
              {activeCollection.description && (
                <p className="mt-1.5 text-sm text-[rgba(21,21,21,0.75)] font-medium max-w-lg">
                  {activeCollection.description}
                </p>
              )}
            </div>

            {/* Items inside collection */}
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#FFFEF7] border border-[rgba(21,21,21,0.06)]">
                <span className="font-handwritten text-lg font-bold text-[#77736C] block mb-1">
                  this folder is empty
                </span>
                <p className="text-sm text-[#151515] mb-4">
                  Add links or notes directly into {activeCollection.name}.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="pill-btn pill-btn-black text-xs"
                >
                  <Plus size={14} />
                  <span>Add Something Here</span>
                </button>
              </div>
            ) : (
              <div className="item-grid">
                {filteredItems.slice(0, visibleLimit).map(item => (
                  <SavedItemCard
                    key={item.id}
                    item={item}
                    collectionName={activeCollection.name}
                    collectionColor={activeCollection.color}
                    isSelected={selectedItemIds.has(item.id)}
                    isSelectionMode={isSelectionMode}
                    onSelect={toggleSelectItemId}
                    onClick={(i) => setDetailItem(i)}
                    onCopy={handleCopy}
                    onToggleFavorite={handleToggleFavorite}
                    onMove={(i) => {
                      setItemsToMove([i.id]);
                      setIsMoveModalOpen(true);
                    }}
                    onShare={handleShare}
                    onToggleArchive={handleToggleArchive}
                    onDelete={(i) => setDeleteItemTarget(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {(activeTab === 'search' || selectedCollectionId) && filteredItems.length > visibleLimit && <button className="pill-btn empty-secondary mx-auto mb-8" onClick={() => setVisibleLimit(limit => limit + 60)}>Show more / {Math.min(visibleLimit, filteredItems.length)} of {filteredItems.length}</button>}
        <footer className="vault-footer"><span>discuss/stash</span><span>Your personal library. Stored on your device.</span><span>stash.discussit.in</span></footer>
      </main>

      {/* Floating Liquid-Glass Navigation Bar on Mobile */}
      <FloatingNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedCollectionId(null);
          setActiveTab(tab);
        }}
        onOpenAdd={() => setIsAddOpen(true)}
      />

      {/* Multi-Select Floating Action Toolbar */}
      {isSelectionMode && selectedItemIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedItemIds.size}
          onMove={handleBulkMove}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          onCancel={() => {
            setSelectedItemIds(new Set());
            setIsSelectionMode(false);
          }}
        />
      )}

      {/* =========================================================================
          MODALS & SHEETS
         ========================================================================= */}
      {/* 1. Add Sheet */}
      <AddSheet
        isOpen={isAddOpen}
        initialType={addInitialType}
        initialUrl={addInitialUrl}
        collections={collections}
        onClose={() => {
          setIsAddOpen(false);
          setAddInitialUrl('');
        }}
        onSaveLink={handleSaveLink}
        onSaveNote={handleSaveNote}
        onSaveChecklist={handleSaveChecklist}
        onSaveLocation={handleSaveLocation}
        onSaveFile={handleSaveFile}
        onCreateCollection={async (name, color) => {
          const newCol = await addCollection({ name, color, icon: 'Folder' });
          await refreshData();
          return newCol.id;
        }}
      />

      {/* 2. Item Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        collections={collections}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        onCopy={handleCopy}
        onShare={handleShare}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        onMove={(i) => {
          setItemsToMove([i.id]);
          setIsMoveModalOpen(true);
        }}
        onDelete={(i) => {
          setDetailItem(null);
          setDeleteItemTarget(i);
        }}
        onUpdate={handleUpdateItem}
        onRefreshPreview={handleRefreshPreview}
      />

      {sharingCollection && <ShareCollectionModal collection={sharingCollection} items={items.filter(item => item.folderId === sharingCollection.id && !item.isArchived)} includeSignature={settings.includeShareSignature} onClose={() => setSharingCollection(null)} />}
      {/* 3. Collection Create / Edit Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        editingCollection={editingCollection}
        onSave={handleSaveCollection}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
      />

      {/* 4. Move Folder Modal */}
      <MoveFolderModal
        isOpen={isMoveModalOpen}
        collections={collections}
        itemCount={itemsToMove.length}
        onSelectFolder={async (targetFolderId) => {
          await moveItemsToFolder(itemsToMove, targetFolderId);
          setDetailItem(previous => previous && itemsToMove.includes(previous.id) ? { ...previous, folderId: targetFolderId } : previous);
          await refreshData();
          setItemsToMove([]);
          setIsMoveModalOpen(false);
          showToast('Moved to collection', 'success');
        }}
        onCreateFolder={async (name, color) => {
          const newCol = await addCollection({ name, color, icon: 'Folder' });
          await refreshData();
          return newCol.id;
        }}
        onClose={() => {
          setIsMoveModalOpen(false);
          setItemsToMove([]);
        }}
      />

      {/* 5. Settings & Vault Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        collections={collections}
        onUpdateSettings={async (updates) => {
          const updated = await updateAppSettings(updates);
          setSettings(updated);
          showToast('Preferences updated', 'success');
        }}
        onEraseAll={handleEraseAll}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshData={refreshData}
      />

      {/* 6. Single Item Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteItemTarget)}
        title="Delete this saved item?"
        description="This item will be removed from your stash."
        confirmText="Delete Item"
        onConfirm={async () => {
          if (deleteItemTarget) {
            await deleteItem(deleteItemTarget.id);
            setDeleteItemTarget(null);
            await refreshData();
            showToast('Item deleted', 'info');
          }
        }}
        onCancel={() => setDeleteItemTarget(null)}
      />

      {/* 7. Collection Delete Confirmation with Safe Move to Unsorted choice */}
      {deleteCollectionTarget && (
        <ConfirmationModal
          isOpen={Boolean(deleteCollectionTarget)}
          title={`Delete "${deleteCollectionTarget.name}"?`}
          description="This collection contains saved items. What would you like to do with them?"
          isFolderDelete={true}
          confirmText="Delete Collection and All Its Items"
          alternativeText="Move Items to Unsorted"
          onConfirmAlternative={() => handleDeleteCollection('move-to-unsorted')}
          onConfirm={() => handleDeleteCollection('delete-all')}
          onCancel={() => setDeleteCollectionTarget(null)}
        />
      )}

      {/* 8. Bulk Delete Confirmation */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        title={`Delete ${selectedItemIds.size} saved items?`}
        description="These items will be permanently removed from your stash."
        confirmText="Delete Selected"
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
      />

      {/* 9. Duplicate Link Notice Modal */}
      {duplicateModalInfo && (
        <DuplicateNoticeModal
          isOpen={Boolean(duplicateModalInfo)}
          existingItem={duplicateModalInfo.existingItem}
          incomingUrl={duplicateModalInfo.incomingUrl}
          onViewExisting={(i) => {
            setDuplicateModalInfo(null);
            setDetailItem(i);
          }}
          onUpdateExisting={(i) => {
            setDuplicateModalInfo(null);
            setDetailItem(i);
          }}
          onKeepAnotherCopy={async () => {
            const copyUrl = duplicateModalInfo.incomingUrl;
            setDuplicateModalInfo(null);
            const info = await inspectUrl(copyUrl);
            await addItem({
              type: 'link',
              originalUrl: info.rawUrl,
              normalizedUrl: info.normalizedUrl + '#' + Date.now(), // Unique identifier
              title: info.derivedTitle,
              platform: info.platform,
              sourceHost: info.sourceHost,
              thumbnailUrl: info.thumbnailUrl || info.faviconUrl,
              folderId: 'unsorted',
              tags: ['copy'],
              isFavorite: false,
              isArchived: false
            });
            await refreshData();
            showToast('Saved another copy to stash', 'success');
          }}
          onCancel={() => setDuplicateModalInfo(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  if (!['/', '/index.html', '/share-target', '/share-target/'].includes(window.location.pathname)) return <NotFound />;
  return (
    <ToastProvider>
      <StashApp />
    </ToastProvider>
  );
}
