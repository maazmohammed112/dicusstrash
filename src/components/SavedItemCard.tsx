import React, { useState } from 'react';
import { useModalLifecycle } from '../hooks/useModalLifecycle';
import { createPortal } from 'react-dom';
import type { SavedItem } from '../types/stash';
import { ItemThumbnail } from './ItemThumbnail';
import { PLATFORM_LABELS } from '../services/platformDetector';
import { Heart, Copy, MoreHorizontal, Share2, FolderSync, Archive, Trash2, Check, Pin, PinOff, X } from 'lucide-react';
interface SavedItemCardProps {
  item: SavedItem; collectionName?: string; collectionColor?: string;
  isSelected?: boolean; isSelectionMode?: boolean; onSelect?: (id: string) => void;
  onClick: (item: SavedItem) => void; onCopy: (url: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string) => void;
  onMove: (item: SavedItem) => void; onShare: (item: SavedItem) => void;
  onToggleArchive: (id: string) => void; onDelete: (item: SavedItem) => void;
}
export const SavedItemCard: React.FC<SavedItemCardProps> = ({ item, collectionName = 'Unsorted', isSelected = false, isSelectionMode = false, onSelect, onClick, onCopy, onToggleFavorite, onTogglePin, onMove, onShare, onToggleArchive, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  useModalLifecycle(menuOpen, () => setMenuOpen(false));
  const url = item.originalUrl || item.locationData?.mapsUrl;
  const title = /^https?:\/\//i.test(item.title) ? PLATFORM_LABELS[item.platform] : item.title;
  const showDetails = () => isSelectionMode && onSelect ? onSelect(item.id) : onClick(item);
  return <article className={`saved-card compact-saved-card ${isSelected ? 'card-selected' : ''} ${item.pinnedAt ? 'card-pinned' : ''}`} data-type={item.type}>
    {isSelectionMode ? <button className="compact-thumbnail-button" onClick={showDetails} aria-label={`Select ${title}`} aria-pressed={isSelected}>{isSelected ? <Check size={22} /> : <ItemThumbnail item={item} />}</button> : url ? <a className="compact-thumbnail-button" href={url} target="_blank" rel="noopener noreferrer" aria-label={title}><ItemThumbnail item={item} /></a> : <button className="compact-thumbnail-button" onClick={showDetails} aria-label={title}><ItemThumbnail item={item} /></button>}
    <button className="compact-card-copy" onClick={showDetails} aria-label={`Details for ${title}`}>
      <h3>{title}</h3><span className="compact-card-meta"><span>{collectionName}</span><span>{PLATFORM_LABELS[item.platform] || 'Saved item'}</span></span>
    </button>
    <div className="compact-card-actions">
      {!isSelectionMode && <button onClick={() => onTogglePin(item.id)} aria-label={item.pinnedAt ? 'Unpin item' : 'Pin item'} aria-pressed={Boolean(item.pinnedAt)} title={item.pinnedAt ? 'Unpin item' : 'Pin item'}><Pin size={15} fill={item.pinnedAt ? 'currentColor' : 'none'} /></button>}
      <button onClick={() => setMenuOpen(true)} aria-label={`Actions for ${title}`}><MoreHorizontal size={19} /></button>
    </div>
    {menuOpen && createPortal(<div className="item-actions-backdrop" onClick={e => { if (e.target === e.currentTarget) setMenuOpen(false); }} onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false); }}>
      <section className="item-actions-menu" role="dialog" aria-modal="true" aria-label="Saved item actions">
        <div className="item-actions-heading"><strong>{title}</strong><button autoFocus onClick={() => setMenuOpen(false)} aria-label="Close actions"><X size={18} /></button></div>
        {url && <button onClick={() => { onCopy(url); setMenuOpen(false); }}><Copy size={16} />Copy link</button>}
        <button onClick={() => { onTogglePin(item.id); setMenuOpen(false); }}>{item.pinnedAt ? <PinOff size={16} /> : <Pin size={16} />}{item.pinnedAt ? 'Unpin' : 'Pin to top'}</button>
        <button onClick={e => { onToggleFavorite(item.id, e); setMenuOpen(false); }}><Heart size={16} />{item.isFavorite ? 'Remove favorite' : 'Favorite'}</button>
        <button onClick={() => { onShare(item); setMenuOpen(false); }}><Share2 size={16} />Share</button>
        <button onClick={() => { onMove(item); setMenuOpen(false); }}><FolderSync size={16} />Move to collection</button>
        <button onClick={() => { onToggleArchive(item.id); setMenuOpen(false); }}><Archive size={16} />{item.isArchived ? 'Restore' : 'Archive'}</button>
        <button className="item-action-delete" onClick={() => { onDelete(item); setMenuOpen(false); }}><Trash2 size={16} />Delete</button>
      </section>
    </div>, document.body)}
  </article>;
};
