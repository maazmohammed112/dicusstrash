import React from 'react';
import { FolderSync, Archive, Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onMove: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onMove,
  onArchive,
  onDelete,
  onCancel
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[92vw]">
      <div
        className="animate-sheet flex items-center gap-2 p-2 px-4 rounded-full liquid-glass border border-[rgba(255,255,255,0.9)] shadow-2xl"
        style={{
          boxShadow: '0 20px 48px rgba(21, 21, 21, 0.16)'
        }}
      >
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#151515] text-[#FFFEF7] mr-1">
          {selectedCount} selected
        </span>

        <button
          type="button"
          onClick={onMove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors cursor-pointer"
        >
          <FolderSync size={14} />
          <span>Move</span>
        </button>

        <button
          type="button"
          onClick={onArchive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#151515] hover:bg-[#F6EDCF] transition-colors cursor-pointer"
        >
          <Archive size={14} />
          <span>Archive</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#F2755B] hover:bg-[rgba(242,117,91,0.12)] transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>

        <div className="w-[1px] h-4 bg-[rgba(21,21,21,0.15)] mx-1" />

        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] transition-colors cursor-pointer"
          title="Cancel Selection"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
