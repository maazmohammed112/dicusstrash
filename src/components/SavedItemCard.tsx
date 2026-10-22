import React, { useState } from 'react';
import type { SavedItem } from '../types/stash';
import { PlatformIcon } from './PlatformIcon';
import { Heart, Copy, MoreHorizontal, ExternalLink, Share2, FolderSync, Archive, Trash2, Check } from 'lucide-react';

interface SavedItemCardProps {
  item: SavedItem;
  collectionName?: string;
  collectionColor?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (id: string) => void;
  onClick: (item: SavedItem) => void;
  onCopy: (url: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onMove: (item: SavedItem) => void;
  onShare: (item: SavedItem) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (item: SavedItem) => void;
}

export const SavedItemCard: React.FC<SavedItemCardProps> = ({
  item,
  collectionName = 'Unsorted',
  collectionColor = '#F6EDCF',
  isSelected = false,
  isSelectionMode = false,
  onSelect,
  onClick,
  onCopy,
  onToggleFavorite,
  onMove,
  onShare,
  onToggleArchive,
  onDelete
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = item.originalUrl || item.locationData?.mapsUrl || window.location.href;
    onCopy(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(item.id);
    } else {
      onClick(item);
    }
  };

  // Determine card pastel tint or surface
  const isChecklist = item.type === 'checklist';

  return (
    <div
      onClick={handleCardClick}
      tabIndex={0}
      aria-label={item.title}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleCardClick(); } }}
      data-type={item.type}
      className={`saved-card group relative flex flex-col justify-between p-4 sm:p-5 rounded-[26px] transition-all duration-200 cursor-pointer select-none border ${
        isSelected
          ? 'ring-2 ring-[#151515] bg-[#FFF9EA]'
          : 'bg-[#FFFEF7] hover:bg-[#FFFDF6] border-[rgba(21,21,21,0.08)] shadow-[0_4px_16px_rgba(21,21,21,0.03)] hover:shadow-[0_8px_24px_rgba(21,21,21,0.07)] hover:-translate-y-0.5'
      }`}
    >
      {/* Top Header: Platform/Type Pill & Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Multi-select indicator or Platform icon */}
          {isSelectionMode ? (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                isSelected ? 'bg-[#151515] border-[#151515] text-[#FFFEF7]' : 'border-[rgba(21,21,21,0.25)] bg-white'
              }`}
            >
              {isSelected && <Check size={14} strokeWidth={3} />}
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: collectionColor }}
            >
              <PlatformIcon platform={item.platform} size={14} />
            </div>
          )}

          {/* Folder pill */}
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[120px]"
            style={{ backgroundColor: 'rgba(21, 21, 21, 0.05)', color: '#77736C' }}
          >
            {collectionName}
          </span>
        </div>

        {/* Action icons: Copy & Favorite */}
        <div className="flex items-center gap-1">
          {item.originalUrl && (
            <button
              type="button"
              onClick={handleCopyClick}
              className="p-1.5 rounded-full text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] transition-colors"
              title="Copy URL"
            >
              {copied ? <Check size={14} className="text-[#151515]" /> : <Copy size={14} />}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => onToggleFavorite(item.id, e)}
            className="p-1.5 rounded-full transition-colors"
            title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={15}
              fill={item.isFavorite ? '#F2755B' : 'none'}
              stroke={item.isFavorite ? '#F2755B' : '#77736C'}
              strokeWidth={item.isFavorite ? 2.5 : 1.8}
            />
          </button>

          {/* Context Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-full text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] transition-colors"
              title="More options"
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div
                  className="absolute right-0 top-8 z-40 w-44 p-1.5 rounded-2xl liquid-glass shadow-xl border border-[rgba(255,255,255,0.9)] animate-scale"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.originalUrl && (
                    <a
                      href={item.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors"
                    >
                      <ExternalLink size={13} />
                      Open Original
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onShare(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors"
                  >
                    <Share2 size={13} />
                    Share
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onMove(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors"
                  >
                    <FolderSync size={13} />
                    Move to Folder
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleArchive(item.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors"
                  >
                    <Archive size={13} />
                    {item.isArchived ? 'Restore' : 'Archive'}
                  </button>

                  <div className="h-[1px] bg-[rgba(21,21,21,0.08)] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#F2755B] hover:bg-[rgba(242,117,91,0.12)] transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Thumbnail if available */}
        {item.thumbnailUrl && item.type === 'link' && (
          <div className="relative w-full h-32 mb-3 rounded-2xl overflow-hidden bg-[#F6EDCF] border border-[rgba(21,21,21,0.04)]">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // If thumbnail fails, hide image element cleanly
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <h3 className="font-bold text-base text-[#151515] leading-snug line-clamp-2 tracking-tight group-hover:text-[#F2755B] transition-colors">
          {item.title}
        </h3>

        {/* Text note or snippet */}
        {item.note && (
          <p className="mt-1.5 text-xs text-[#77736C] line-clamp-2 leading-relaxed">
            {item.note}
          </p>
        )}

        {/* Checklist Snippet */}
        {isChecklist && item.checklist && item.checklist.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {item.checklist.slice(0, 3).map(check => (
              <div key={check.id} className="flex items-center gap-2 text-xs text-[#151515]">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    check.completed ? 'bg-[#151515] border-[#151515]' : 'border-[rgba(21,21,21,0.3)]'
                  }`}
                >
                  {check.completed && <Check size={9} className="text-white" />}
                </div>
                <span className={`truncate ${check.completed ? 'line-through text-[#77736C]' : ''}`}>
                  {check.text}
                </span>
              </div>
            ))}
            {item.checklist.length > 3 && (
              <span className="text-[10px] text-[#77736C] font-semibold mt-0.5">
                +{item.checklist.length - 3} more items
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-medium text-[#77736C] bg-[#F6EDCF] px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Source Host & Timestamp */}
      <div className="mt-3 pt-2.5 flex items-center justify-between text-[11px] text-[#77736C] border-t border-[rgba(21,21,21,0.05)]">
        <span className="truncate max-w-[130px] font-medium">
          {item.sourceHost || item.platform}
        </span>
        <span className="font-normal">{formatTimeAgo(item.createdAt)}</span>
      </div>
    </div>
  );
};
