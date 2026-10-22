import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React, { useState, useEffect } from 'react';
import type { Collection, ItemType } from '../types/stash';
import { NotesEditor } from './NotesEditor';
import { ChecklistEditor } from './ChecklistEditor';
import { LocationEditor } from './LocationEditor';
import { readClipboardUrl } from '../services/clipboardService';
import { inspectUrl, extractUrlFromText } from '../services/platformDetector';
import { PlatformIcon } from './PlatformIcon';
import { X, Link2, FileText, CheckSquare, MapPin, Paperclip, Loader2 } from 'lucide-react';

interface AddSheetProps {
  isOpen: boolean;
  initialType?: ItemType;
  initialUrl?: string;
  collections: Collection[];
  onClose: () => void;
  onSaveLink: (data: {
    url: string;
    title: string;
    note?: string;
    folderId: string;
    thumbnailUrl?: string;
  }) => Promise<void>;
  onSaveNote: (data: {
    title: string;
    note: string;
    tags: string[];
    folderId: string;
  }) => Promise<void>;
  onSaveChecklist: (data: {
    title: string;
    checklist: any[];
    folderId: string;
  }) => Promise<void>;
  onSaveLocation: (data: {
    placeName: string;
    mapsUrl?: string;
    address?: string;
    note?: string;
    folderId: string;
  }) => Promise<void>;
  onSaveFile: (file: File, folderId: string, note?: string) => Promise<void>;
  onCreateCollection: (name: string, color: string) => Promise<string>;
}

export const AddSheet: React.FC<AddSheetProps> = ({
  isOpen,
  initialType = 'link',
  initialUrl = '',
  collections,
  onClose,
  onSaveLink,
  onSaveNote,
  onSaveChecklist,
  onSaveLocation,
  onSaveFile,
  onCreateCollection
}) => {
  const [activeTab, setActiveTab] = useState<ItemType>(initialType);

  // Link state
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const [linkFolderId, setLinkFolderId] = useState('unsorted');
  const [linkThumbnail, setLinkThumbnail] = useState<string | undefined>(undefined);
  const [isInspecting, setIsInspecting] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<any>('website');

  // File state
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileFolderId, setFileFolderId] = useState('unsorted');
  const [fileNote, setFileNote] = useState('');

  // Inline folder creation
  const [isInlineCreatingFolder, setIsInlineCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [mapsSeed, setMapsSeed] = useState<{ placeName: string; mapsUrl: string } | undefined>();
  const [clipboardNotice, setClipboardNotice] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialType);
    setUrlInput(initialUrl);
    setLinkTitle(''); setLinkNote(''); setLinkThumbnail(undefined);
    setLinkFolderId('unsorted'); setFileFolderId('unsorted');
    setMapsSeed(undefined); setClipboardNotice('');
    if (initialUrl) void handleInspect(initialUrl);
  }, [initialType, initialUrl, isOpen]);

  useModalLifecycle(isOpen, onClose);

  async function handleInspect(rawInput: string) {
    const extracted = extractUrlFromText(rawInput);
    if (!extracted) return;
    setIsInspecting(true);
    try {
      const info = await inspectUrl(extracted);
      setDetectedPlatform(info.platform);
      setLinkTitle(info.derivedTitle);
      setLinkThumbnail(info.thumbnailUrl);
      if (info.platform === 'maps') {
        setMapsSeed({ placeName: info.derivedTitle, mapsUrl: info.normalizedUrl });
        setActiveTab('location');
      }
    } catch { /* Incomplete addresses remain editable. */ }
    finally { setIsInspecting(false); }
  }

  if (!isOpen) return null;

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const extracted = extractUrlFromText(urlInput) || urlInput.trim();
    await onSaveLink({
      url: extracted,
      title: linkTitle.trim() || 'Saved Link',
      note: linkNote.trim() || undefined,
      folderId: linkFolderId,
      thumbnailUrl: linkThumbnail
    });

    onClose();
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isSavingFile) return;
    setIsSavingFile(true);
    setFileError('');
    try {
      await onSaveFile(selectedFile, fileFolderId, fileNote.trim() || undefined);
      setSelectedFile(null);
      onClose();
    } catch {
      setFileError('The file could not be saved. Your device may be out of storage. Please try again.');
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleInlineFolderCreate = async () => {
    if (!newFolderName.trim()) return;
    const colors = ['#FFD76D', '#F2755B', '#BFD9F8', '#DCCCF5', '#B4E8C2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newId = await onCreateCollection(newFolderName.trim(), randomColor);
    setLinkFolderId(newId);
    setFileFolderId(newId);
    setNewFolderName('');
    setIsInlineCreatingFolder(false);
  };

  return (
    <div
      role="presentation"
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{
        backgroundColor: 'rgba(21, 21, 21, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Add to stash" tabIndex={-1}
        className="modal-panel addsheet animate-sheet sm:animate-scale relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col p-5 sm:p-7 rounded-t-[32px] sm:rounded-[36px] overflow-hidden"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.2)'
        }}
      >
        {/* Header & Tabs */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-handwritten text-xl font-bold text-[#151515]">
            add to stash
          </span>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[#F6EDCF] hover:bg-[#EADBAB] flex items-center justify-center text-[#151515] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Segmented Controls (Reference 3 Selection Pill style) */}
        <div className="add-type-tabs">
          {[
            { id: 'link', label: 'Link', icon: Link2 },
            { id: 'note', label: 'Note', icon: FileText },
            { id: 'checklist', label: 'Checklist', icon: CheckSquare },
            { id: 'location', label: 'Place', icon: MapPin },
            { id: 'file', label: 'File', icon: Paperclip }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ItemType)}
                className={`min-w-0 py-2 px-1 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#151515] text-[#FFFEF7] shadow-sm'
                    : 'text-[#77736C] hover:text-[#151515]'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content */}
        <div className="modal-scroll flex-1 overflow-y-auto pr-1">
          {/* TAB 1: SAVE LINK */}
          {activeTab === 'link' && (
            <form onSubmit={handleLinkSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
                  <Link2 size={13} />
                  <span>URL / Web Address</span>
                  <button type="button" className="paste-url-button" onClick={async () => {
                    const url = await readClipboardUrl();
                    if (url) { setUrlInput(url); setClipboardNotice(''); await handleInspect(url); }
                    else setClipboardNotice('No web link available. You can paste a URL into the field.');
                  }}>Paste URL</button>
                </label>
                {clipboardNotice && <p className="share-caption" role="status">{clipboardNotice}</p>}
                <div className="url-input-wrap relative flex items-center">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      handleInspect(e.target.value);
                    }}
                    placeholder="https://example.com"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515] pr-10"
                  />
                  {isInspecting && (
                    <Loader2 size={16} className="animate-spin text-[#77736C] absolute right-3" />
                  )}
                  {!isInspecting && detectedPlatform && (
                    <span className="absolute right-3">
                      <PlatformIcon platform={detectedPlatform} size={16} />
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Title or description..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] font-semibold focus:outline-none focus:ring-2 focus:ring-[#151515]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1.5">
                  Personal Note (Optional)
                </label>
                <textarea
                  value={linkNote}
                  onChange={(e) => setLinkNote(e.target.value)}
                  placeholder="Why did you save this?"
                  rows={2}
                  className="w-full p-3 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515] resize-none"
                />
              </div>

              {/* Folder Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#77736C]">
                    Destination Collection
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsInlineCreatingFolder(!isInlineCreatingFolder)}
                    className="text-xs font-semibold text-[#F2755B] hover:underline cursor-pointer"
                  >
                    + New Collection
                  </button>
                </div>

                {isInlineCreatingFolder ? (
                  <div className="flex gap-2 mb-2 p-2 rounded-xl bg-[#FFF9EA] border border-[#E7DEC7]">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[rgba(21,21,21,0.15)] bg-white text-xs text-[#151515] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleInlineFolderCreate}
                      disabled={!newFolderName.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#151515] text-[#FFFEF7] text-xs font-semibold disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                ) : null}

                <select
                  value={linkFolderId}
                  onChange={(e) => setLinkFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs font-semibold text-[#151515] focus:outline-none cursor-pointer"
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="flex-1 py-3 px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-30 hover:bg-[#252525] transition-all shadow-md"
                >
                  Save to Stash
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: WRITE NOTE */}
          {activeTab === 'note' && (
            <NotesEditor
              collections={collections}
              onSave={async (data) => {
                await onSaveNote(data);
                onClose();
              }}
              onCancel={onClose}
            />
          )}

          {/* TAB 3: CHECKLIST */}
          {activeTab === 'checklist' && (
            <ChecklistEditor
              collections={collections}
              onSave={async (data) => {
                await onSaveChecklist(data);
                onClose();
              }}
              onCancel={onClose}
            />
          )}

          {/* TAB 4: LOCATION */}
          {activeTab === 'location' && (
            <LocationEditor
              initialData={mapsSeed}
              collections={collections}
              onSave={async (data) => {
                await onSaveLocation(data);
                onClose();
              }}
              onCancel={onClose}
            />
          )}

          {/* TAB 5: FILE */}
          {activeTab === 'file' && (
            <form onSubmit={handleFileSubmit} className="file-upload-form flex flex-col gap-4">
              <p className="file-storage-note">Images, PDFs, audio and documents stay on this device. You can download the original anytime from the saved item.</p>
              {fileError && <p className="file-error" role="alert">{fileError}</p>}
              <div>
                <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
                  <Paperclip size={13} />
                  <span>Select Local File (Image, PDF, Audio, Document)</span>
                </label>
                <input
                  type="file"
                  aria-label="Choose a file to save on this device"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setFileError('');
                    }
                  }}
                  className="w-full text-xs text-[#151515] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#151515] file:text-[#FFFEF7] hover:file:bg-[#252525] file:cursor-pointer p-2 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-[#77736C]">
                    Selected: <strong className="text-[#151515]">{selectedFile.name}</strong> (
                    {(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1.5">
                  Optional Note
                </label>
                <textarea
                  value={fileNote}
                  onChange={e => setFileNote(e.target.value)}
                  placeholder="Notes about this file..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1.5">
                  Collection
                </label>
                <select
                  value={fileFolderId}
                  onChange={e => setFileFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs font-semibold text-[#151515] focus:outline-none cursor-pointer"
                >
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={!selectedFile || isSavingFile}
                  className="flex-1 py-3 px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-30 hover:bg-[#252525] transition-all shadow-md"
                >
                  {isSavingFile ? 'Saving to this device…' : 'Save File to Stash'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
