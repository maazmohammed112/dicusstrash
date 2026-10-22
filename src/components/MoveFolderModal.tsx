import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React, { useState, useEffect } from 'react';
import type { Collection } from '../types/stash';
import { Folder, Plus, Check } from 'lucide-react';

interface MoveFolderModalProps {
  isOpen: boolean;
  collections: Collection[];
  currentFolderId?: string;
  itemCount?: number;
  onSelectFolder: (folderId: string) => void | Promise<void>;
  onCreateFolder: (name: string, color: string) => Promise<string>;
  onClose: () => void;
}

const PASTEL_COLORS = ['#FFD76D', '#F2755B', '#BFD9F8', '#DCCCF5', '#B4E8C2', '#F6EDCF'];

export const MoveFolderModal: React.FC<MoveFolderModalProps> = ({
  isOpen,
  collections,
  currentFolderId,
  itemCount = 1,
  onSelectFolder,
  onCreateFolder,
  onClose
}) => {
  const [selectedFolder, setSelectedFolder] = useState(currentFolderId || 'unsorted');
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState('');
  useEffect(() => { if (isOpen) { setSelectedFolder(currentFolderId || 'unsorted'); setMoveError(''); } }, [isOpen, currentFolderId]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);

  useModalLifecycle(isOpen, onClose);

  if (!isOpen) return null;

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newId = await onCreateFolder(newFolderName.trim(), selectedColor);
    onSelectFolder(newId);
    setNewFolderName('');
    setIsCreating(false);
  };

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Move to collection" tabIndex={-1}
        className="modal-panel movefoldermodal animate-scale relative w-full max-w-sm p-6 rounded-3xl"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.18)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#151515]">
            Move {itemCount > 1 ? `${itemCount} items` : 'item'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F6EDCF] text-[#151515] hover:bg-[#EBDDAF]"
          >
            Close
          </button>
        </div>

        {!isCreating ? (
          <>
            <label className="block text-sm mb-2" htmlFor="move-destination">Destination collection</label>
            <select id="move-destination" className="w-full" value={selectedFolder} onChange={e => setSelectedFolder(e.target.value)}>
              {collections.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
            </select>
            {moveError && <p role="alert" className="file-error mt-3">{moveError}</p>}
            <button className="pill-btn pill-btn-black w-full mt-4" disabled={isMoving || !selectedFolder} onClick={async () => {
              setIsMoving(true); setMoveError('');
              try { await onSelectFolder(selectedFolder); onClose(); }
              catch { setMoveError('Could not move the saved items. Please try again.'); }
              finally { setIsMoving(false); }
            }}><Folder size={16} />{isMoving ? 'Moving…' : 'Move to collection'}</button>

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-4 w-full py-2.5 px-4 rounded-full border border-dashed border-[#151515] text-[#151515] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#FFF9EA] transition-all cursor-pointer"
            >
              <Plus size={16} />
              Create New Collection
            </button>
          </>
        ) : (
          <form onSubmit={handleCreateAndSelect} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-[#77736C] block mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="e.g. Weekend Recipes"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(21,21,21,0.15)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#77736C] block mb-1.5">
                Accent Color
              </label>
              <div className="flex gap-2">
                {PASTEL_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform"
                    style={{
                      backgroundColor: c,
                      transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
                      outline: selectedColor === c ? '2px solid #151515' : 'none'
                    }}
                  >
                    {selectedColor === c && <Check size={12} className="text-[#151515]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-40"
              >
                Create & Select
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-2.5 px-4 rounded-full text-sm font-medium text-[#77736C] hover:text-[#151515]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
