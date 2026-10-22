import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React, { useState } from 'react';
import type { SavedItem, Collection } from '../types/stash';
import { FileAttachment } from './FileAttachment';
import { PlatformIcon } from './PlatformIcon';
import { HighlightMarkerPin } from './HandDrawnAccent';
import {
  X,
  ExternalLink,
  Copy,
  Share2,
  Edit2,
  FolderSync,
  Heart,
  Archive,
  Trash2,
  RefreshCw,
  Check,
  MapPin,
  Tag
} from 'lucide-react';

interface ItemDetailModalProps {
  item: SavedItem | null;
  collections: Collection[];
  isOpen: boolean;
  onClose: () => void;
  onCopy: (url: string) => void;
  onShare: (item: SavedItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string) => void;
  onMove: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
  onUpdate: (id: string, updates: Partial<SavedItem>) => Promise<void>;
  onRefreshPreview?: (item: SavedItem) => Promise<void>;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  collections,
  isOpen,
  onClose,
  onCopy,
  onShare,
  onToggleFavorite,
  onToggleArchive,
  onMove,
  onDelete,
  onUpdate,
  onRefreshPreview
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editFolderId, setEditFolderId] = useState('');
  const [editTags, setEditTags] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useModalLifecycle(isOpen && Boolean(item), onClose);

  if (!isOpen || !item) return null;

  const currentCollection = collections.find(c => c.id === item.folderId) || {
    name: 'Unsorted',
    color: '#F6EDCF'
  };

  const handleStartEdit = () => {
    setEditTitle(item.title);
    setEditNote(item.note || '');
    setEditFolderId(item.folderId);
    setEditTags(item.tags ? item.tags.join(', ') : '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const tags = editTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    await onUpdate(item.id, {
      title: editTitle.trim() || item.title,
      note: editNote.trim(),
      folderId: editFolderId,
      tags
    });
    setIsEditing(false);
  };

  const handleCopy = () => {
    const url = item.originalUrl || item.locationData?.mapsUrl || window.location.href;
    onCopy(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    if (!onRefreshPreview) return;
    setIsRefreshing(true);
    try {
      await onRefreshPreview(item);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleChecklistItem = async (checkId: string) => {
    if (!item.checklist) return;
    const updated = item.checklist.map(c =>
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    await onUpdate(item.id, { checklist: updated });
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(item.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div
      role="presentation"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        backgroundColor: 'rgba(21, 21, 21, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Saved item" tabIndex={-1}
        className="modal-panel itemdetailmodal animate-scale relative w-full max-w-2xl max-h-[92vh] flex flex-col p-6 sm:p-8 rounded-[36px] overflow-hidden"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.22)'
        }}
      >
        {/* Top Floating Action Bar (inspired by Reference 2 & 3) */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(21,21,21,0.06)] mb-5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F6EDCF] hover:bg-[#EADBAB] flex items-center justify-center text-[#151515] transition-all cursor-pointer"
              title="Back"
            >
              <X size={18} />
            </button>

            {/* Folder badge */}
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ backgroundColor: currentCollection.color || '#F6EDCF', color: '#151515' }}
            >
              <PlatformIcon platform={item.platform} size={13} />
              <span>{currentCollection.name}</span>
            </span>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5">
            {item.originalUrl && (
              <button
                type="button"
                onClick={handleCopy}
                className="w-9 h-9 rounded-full bg-[#FFFEF7] hover:bg-[#F6EDCF] border border-[rgba(21,21,21,0.08)] flex items-center justify-center text-[#151515] transition-colors cursor-pointer"
                title="Copy Link"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            )}

            <button
              type="button"
              onClick={() => onShare(item)}
              className="w-9 h-9 rounded-full bg-[#FFFEF7] hover:bg-[#F6EDCF] border border-[rgba(21,21,21,0.08)] flex items-center justify-center text-[#151515] transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => onToggleFavorite(item.id, e)}
              className="w-9 h-9 rounded-full bg-[#FFFEF7] hover:bg-[#F6EDCF] border border-[rgba(21,21,21,0.08)] flex items-center justify-center transition-colors cursor-pointer"
              title="Favorite"
            >
              <Heart
                size={16}
                fill={item.isFavorite ? '#F2755B' : 'none'}
                stroke={item.isFavorite ? '#F2755B' : '#77736C'}
                strokeWidth={item.isFavorite ? 2.5 : 1.8}
              />
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="w-9 h-9 rounded-full bg-[#151515] text-[#FFFEF7] flex items-center justify-center transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3.5 py-1.5 rounded-full bg-[#151515] text-[#FFFEF7] text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Detail Body */}
        <div className="modal-scroll flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
          {item.type === 'file' && <FileAttachment itemId={item.id} />}
          {/* Thumbnail / Hero Image if available */}
          {item.thumbnailUrl && item.type === 'link' && (
            <div className="relative w-full max-h-72 rounded-3xl overflow-hidden bg-[#F6EDCF] border border-[rgba(21,21,21,0.06)] shadow-sm">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* EDIT MODE OR VIEW MODE */}
          {!isEditing ? (
            <>
              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#151515] tracking-tight leading-tight">
                  {item.title}
                </h1>
                {item.sourceHost && (
                  <p className="mt-1 text-xs font-medium text-[#77736C]">
                    Source: <span className="text-[#151515]">{item.sourceHost}</span>
                  </p>
                )}
              </div>

              {/* Note / Highlight Area */}
              {item.note && (
                <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF9EA] border border-[#EADBAB]">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#77736C]">
                    <HighlightMarkerPin position="start" />
                    <span>Personal Note</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#151515] leading-relaxed whitespace-pre-wrap font-normal">
                    {item.note}
                  </p>
                </div>
              )}

              {/* Checklist rendering */}
              {item.type === 'checklist' && item.checklist && (
                <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFDF6] border border-[rgba(21,21,21,0.08)]">
                  <span className="text-xs font-bold text-[#77736C] uppercase tracking-wider block mb-3">
                    Checklist Items
                  </span>
                  <div className="flex flex-col gap-2">
                    {item.checklist.map(c => (
                      <div
                        key={c.id}
                        onClick={() => toggleChecklistItem(c.id)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F6EDCF] transition-colors cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            c.completed ? 'bg-[#151515] border-[#151515]' : 'border-[rgba(21,21,21,0.3)] bg-white'
                          }`}
                        >
                          {c.completed && <Check size={11} className="text-white" />}
                        </div>
                        <span
                          className={`text-sm ${
                            c.completed ? 'line-through text-[#77736C]' : 'text-[#151515] font-medium'
                          }`}
                        >
                          {c.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location details */}
              {item.type === 'location' && item.locationData && (
                <div className="p-4 rounded-3xl bg-[#FFF9EA] border border-[#E7DEC7] flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#151515]">
                    <MapPin size={16} className="text-[#F2755B]" />
                    <span>{item.locationData.placeName}</span>
                  </div>
                  {item.locationData.address && (
                    <p className="text-xs text-[#77736C]">{item.locationData.address}</p>
                  )}
                  {item.locationData.mapsUrl && (
                    <a
                      href={item.locationData.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#151515] underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink size={12} />
                      View on Google Maps
                    </a>
                  )}
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Tag size={13} className="text-[#77736C] mr-1" />
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-[#F6EDCF] text-[#151515]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Original URL action link */}
              {item.originalUrl && (
                <div className="p-4 rounded-2xl bg-[#FFFDF6] border border-[rgba(21,21,21,0.06)] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-[#77736C] block">Original Link</span>
                    <p className="text-xs text-[#151515] truncate font-mono mt-0.5">{item.originalUrl}</p>
                  </div>
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-full bg-[#151515] text-[#FFFEF7] text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-[#252525]"
                  >
                    <ExternalLink size={13} />
                    <span>Open</span>
                  </a>
                </div>
              )}

              {/* Timestamps & Info */}
              <div className="text-[11px] text-[#77736C] pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(21,21,21,0.05)]">
                <span>Saved on {formattedDate} at {formattedTime}</span>
                {item.type === 'link' && onRefreshPreview && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#77736C] hover:text-[#151515] cursor-pointer"
                  >
                    <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                    <span>Refresh Preview</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* EDIT FORM */
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1">Notes</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1">Collection</label>
                <select
                  value={editFolderId}
                  onChange={e => setEditFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs font-semibold text-[#151515] focus:outline-none"
                >
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77736C] block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  placeholder="art, typography, reading"
                  className="w-full px-4 py-2 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs text-[#151515] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-full bg-[#151515] text-[#FFFEF7] text-xs font-bold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 rounded-full text-xs font-medium text-[#77736C]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bottom Actions: Move / Archive / Delete */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-[rgba(21,21,21,0.06)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMove(item)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F6EDCF] text-[#151515] hover:bg-[#EADBAB] flex items-center gap-1.5 cursor-pointer"
              >
                <FolderSync size={13} />
                <span>Move</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleArchive(item.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F6EDCF] text-[#151515] hover:bg-[#EADBAB] flex items-center gap-1.5 cursor-pointer"
              >
                <Archive size={13} />
                <span>{item.isArchived ? 'Restore' : 'Archive'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDelete(item)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#F2755B] hover:bg-[rgba(242,117,91,0.12)] flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
