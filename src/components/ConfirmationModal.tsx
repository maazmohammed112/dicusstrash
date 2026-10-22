import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React, { useState } from 'react';
import { AlertTriangle, Trash2, FolderSync } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  isBusy?: boolean;
  title: string;
  description: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  requireTypingWord?: string; // e.g. "ERASE"
  isFolderDelete?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onConfirmAlternative?: () => void; // e.g. "Move to Unsorted"
  alternativeText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  isBusy = false,
  title,
  description,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requireTypingWord,
  isFolderDelete = false,
  onConfirm,
  onCancel,
  onConfirmAlternative,
  alternativeText = 'Move Items to Unsorted'
}) => {
  const [typedInput, setTypedInput] = useState('');

  useModalLifecycle(isOpen, () => { if (!isBusy) onCancel(); });

  if (!isOpen) return null;

  const isConfirmDisabled = Boolean(
    requireTypingWord && typedInput.trim().toUpperCase() !== requireTypingWord.toUpperCase()
  );

  return (
    <div
      role="presentation"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(21, 21, 21, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onCancel();
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-busy={isBusy} aria-label="Confirm action" tabIndex={-1}
        className="modal-panel confirmationmodal animate-scale relative w-full max-w-md p-6 sm:p-7 rounded-3xl"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.18)'
        }}
      >
        {/* Header with warm icon badge */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: type === 'danger' ? 'rgba(242, 117, 91, 0.15)' : '#F6EDCF',
              color: type === 'danger' ? '#F2755B' : '#151515'
            }}
          >
            {type === 'danger' ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#151515] leading-snug">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-[#77736C] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Typed verification if requested (e.g. ERASE) */}
        {requireTypingWord && (
          <div className="my-5 p-3 rounded-2xl bg-[#FFF9EA] border border-[#E7DEC7]">
            <p className="text-xs text-[#77736C] mb-2 font-medium">
              Please type <strong className="text-[#151515]">{requireTypingWord}</strong> to confirm:
            </p>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={requireTypingWord}
              autoFocus
              className="w-full px-3 py-2 rounded-xl border border-rgba(21, 21, 21, 0.12) text-sm bg-white font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#151515]"
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          {/* If Folder Delete with alternative option */}
          {isFolderDelete && onConfirmAlternative && (
            <button
              type="button"
              onClick={onConfirmAlternative}
              disabled={isBusy}
              className="w-full py-3 px-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: '#151515',
                color: '#FFFEF7'
              }}
            >
              <FolderSync size={16} />
              {alternativeText}
            </button>
          )}

          <button
            type="button"
            disabled={isConfirmDisabled || isBusy}
            onClick={onConfirm}
            className="w-full py-3 px-4 rounded-full font-semibold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: type === 'danger' && !isFolderDelete ? '#F2755B' : 'rgba(242, 117, 91, 0.15)',
              color: type === 'danger' && !isFolderDelete ? '#FFFFFF' : '#F2755B',
              border: type === 'danger' && isFolderDelete ? '1px solid rgba(242, 117, 91, 0.3)' : 'none'
            }}
          >
            {confirmText}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Close dialog"
            className="w-full py-2.5 px-4 rounded-full font-medium text-sm text-[#77736C] hover:text-[#151515] transition-all cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
