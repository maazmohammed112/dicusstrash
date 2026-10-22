import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React from 'react';
import type { SavedItem } from '../types/stash';
import { PlatformIcon } from './PlatformIcon';
import { Eye, RefreshCw, CopyPlus, X } from 'lucide-react';

interface DuplicateNoticeModalProps {
  isOpen: boolean;
  existingItem?: SavedItem;
  incomingUrl?: string;
  onViewExisting: (item: SavedItem) => void;
  onUpdateExisting: (item: SavedItem) => void;
  onKeepAnotherCopy: () => void;
  onCancel: () => void;
}

export const DuplicateNoticeModal: React.FC<DuplicateNoticeModalProps> = ({
  isOpen,
  existingItem,
  onViewExisting,
  onUpdateExisting,
  onKeepAnotherCopy,
  onCancel
}) => {
  useModalLifecycle(isOpen && Boolean(existingItem), onCancel);

  if (!isOpen || !existingItem) return null;

  return (
    <div
      role="presentation"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(21, 21, 21, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Already saved" tabIndex={-1}
        className="modal-panel duplicatenoticemodal animate-scale relative w-full max-w-md p-6 rounded-3xl"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.18)'
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#FFD76D] flex items-center justify-center">
              <PlatformIcon platform={existingItem.platform} size={16} />
            </span>
            <h3 className="text-lg font-bold text-[#151515]">Already in your stash</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-1.5 rounded-full hover:bg-[#F6EDCF] text-[#77736C] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[#77736C] mb-4">
          This link was saved previously on{' '}
          <strong className="text-[#151515]">
            {new Date(existingItem.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </strong>
          . What would you like to do?
        </p>

        {/* Existing preview pill */}
        <div className="p-3.5 mb-5 rounded-2xl bg-[#FFF9EA] border border-[#E7DEC7] flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#151515] truncate">{existingItem.title}</h4>
            <p className="text-xs text-[#77736C] truncate mt-0.5">{existingItem.originalUrl}</p>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onViewExisting(existingItem)}
            className="w-full py-3 px-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#151515] text-[#FFFEF7] hover:bg-[#262626]"
          >
            <Eye size={16} />
            View Existing Item
          </button>

          <button
            type="button"
            onClick={() => onUpdateExisting(existingItem)}
            className="w-full py-3 px-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#FFFEF7] border border-[rgba(21,21,21,0.15)] text-[#151515] hover:bg-[#F6EDCF]"
          >
            <RefreshCw size={16} />
            Update Existing with New Notes
          </button>

          <button
            type="button"
            onClick={onKeepAnotherCopy}
            className="w-full py-2.5 px-4 rounded-full font-medium text-sm flex items-center justify-center gap-2 text-[#77736C] hover:text-[#151515] transition-all cursor-pointer"
          >
            <CopyPlus size={15} />
            Keep Another Copy Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
