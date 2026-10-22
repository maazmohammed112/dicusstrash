import React, { useState } from 'react';
import type { Collection } from '../types/stash';
import { Folder, BookOpen, Bookmark, Compass, Heart, Tag, Layers, ArrowUpRight, Share2, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
  itemCount: number;
  onClick: (col: Collection) => void;
  onEdit: (col: Collection, e: React.MouseEvent) => void;
  onShare?: (col: Collection) => void;
  onDelete: (col: Collection, e: React.MouseEvent) => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  itemCount,
  onClick,
  onEdit,
  onDelete,
  onShare
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const CollectionIcon = ({ Folder, BookOpen, Bookmark, Compass, Heart, Tag, Sparkles: Layers } as Record<string, typeof Folder>)[collection.icon] || Folder;
  const isUnsorted = collection.id === 'unsorted';

  return (
    <div
      onClick={() => onClick(collection)}
      tabIndex={0}
      aria-label={collection.name}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(collection); } }}
      className="collection-card group relative flex flex-col justify-between p-5 rounded-[28px] transition-all duration-200 cursor-pointer select-none shadow-[0_4px_18px_rgba(21,21,21,0.04)] hover:shadow-[0_10px_28px_rgba(21,21,21,0.08)] hover:-translate-y-1"
      style={{
        backgroundColor: collection.color || '#F6EDCF',
        border: '1px solid rgba(21, 21, 21, 0.06)'
      }}
    >
      {/* Top row: Icon bubble & context menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#FFFEF7] flex items-center justify-center shadow-sm">
          <CollectionIcon size={20} className="text-[#151515]" strokeWidth={2.2} />
        </div>

        {(
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="Collection actions"
              className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.6)] hover:bg-[#FFFEF7] flex items-center justify-center text-[#151515] transition-colors"
            >
              <MoreHorizontal size={16} />
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
                  className="absolute right-0 top-9 z-40 w-36 p-1.5 rounded-2xl liquid-glass shadow-xl border border-[rgba(255,255,255,0.9)] animate-scale"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onShare && <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-[#F6EDCF]" onClick={() => { setMenuOpen(false); onShare(collection); }}><Share2 size={13} />Share all links</button>}
                  <button
                    type="button"
                    disabled={isUnsorted}
                    onClick={(e) => {
                      setMenuOpen(false);
                      onEdit(collection, e);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors"
                  >
                    <Edit2 size={13} />
                    Edit Folder
                  </button>

                  <button
                    type="button"
                    disabled={isUnsorted}
                    onClick={(e) => {
                      setMenuOpen(false);
                      onDelete(collection, e);
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
        )}
      </div>

      <ArrowUpRight className="collection-arrow" size={24} />
      {/* Title & item count */}
      <div>
        <span className="text-xs font-medium text-[rgba(21,21,21,0.65)] block mb-0.5">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <h3 className="text-lg font-bold text-[#151515] tracking-tight leading-snug line-clamp-1">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-1 text-xs text-[rgba(21,21,21,0.65)] line-clamp-1">
            {collection.description}
          </p>
        )}
      </div>
    </div>
  );
};
