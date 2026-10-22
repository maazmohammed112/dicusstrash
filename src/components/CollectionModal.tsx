import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React, { useState, useEffect } from 'react';
import type { Collection } from '../types/stash';
import { X, Folder, BookOpen, Bookmark, Layers, Compass, Heart, Tag, Check } from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  editingCollection?: Collection | null;
  onSave: (data: {
    name: string;
    description?: string;
    color: string;
    icon: string;
  }) => Promise<void>;
  onClose: () => void;
}

const PASTEL_COLORS = [
  '#FFD76D', // Butter yellow
  '#F2755B', // Soft coral
  '#BFD9F8', // Powder blue
  '#DCCCF5', // Soft lavender
  '#B4E8C2', // Mint / sage
  '#F6EDCF'  // Warm cream
];

const ICONS = [
  { id: 'Folder', label: 'Folder', component: Folder },
  { id: 'BookOpen', label: 'Book', component: BookOpen },
  { id: 'Bookmark', label: 'Bookmark', component: Bookmark },
  { id: 'Sparkles', label: 'Layers', component: Layers },
  { id: 'Compass', label: 'Compass', component: Compass },
  { id: 'Heart', label: 'Heart', component: Heart },
  { id: 'Tag', label: 'Tag', component: Tag }
];

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  editingCollection,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [icon, setIcon] = useState('Folder');

  useEffect(() => {
    if (editingCollection) {
      setName(editingCollection.name);
      setDescription(editingCollection.description || '');
      setColor(editingCollection.color);
      setIcon(editingCollection.icon);
    } else {
      setName('');
      setDescription('');
      setColor(PASTEL_COLORS[0]);
      setIcon('Folder');
    }
  }, [editingCollection, isOpen]);

  useModalLifecycle(isOpen, onClose);

  const SelectedIcon = ICONS.find(option => option.id === icon)?.component || Folder;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon
    });
    onClose();
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
        role="dialog" aria-modal="true" aria-label="Collection" tabIndex={-1}
        className="modal-panel collectionmodal animate-scale relative w-full max-w-md p-6 sm:p-7 rounded-[32px]"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.2)'
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-[#151515]">
            {editingCollection ? 'Edit Collection' : 'New Collection'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[#F6EDCF] hover:bg-[#EADBAB] flex items-center justify-center text-[#151515] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Preview Card */}
        <div
          className="p-4 rounded-2xl mb-5 flex items-center gap-3.5 transition-colors border border-[rgba(21,21,21,0.06)]"
          style={{ backgroundColor: color }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFFEF7] flex items-center justify-center shadow-sm text-[#151515]">
            <SelectedIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-[rgba(21,21,21,0.6)] uppercase tracking-wider block">
              Preview
            </span>
            <h4 className="font-bold text-base text-[#151515] truncate">
              {name.trim() || 'Collection Name'}
            </h4>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#77736C] block mb-1.5">
              Collection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Design Sprints, Travel Spots"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] font-semibold focus:outline-none focus:ring-2 focus:ring-[#151515]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#77736C] block mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What belongs in this vault?"
              className="w-full px-4 py-2 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs text-[#151515] focus:outline-none"
            />
          </div>

          {/* Color palette pills */}
          <div>
            <label className="text-xs font-semibold text-[#77736C] block mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-2.5">
              {PASTEL_COLORS.map(c => (
                <button
                  key={c}
                  aria-label={`Collection color ${c}`}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    outline: color === c ? '2px solid #151515' : '1px solid rgba(21,21,21,0.1)'
                  }}
                >
                  {color === c && <Check size={14} className="text-[#151515]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-semibold text-[#77736C] block mb-2">
              Folder Icon
            </label>
            <div className="flex items-center gap-2">
              {ICONS.map(ic => {
                const IconComp = ic.component;
                const isSelected = icon === ic.id;
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#151515] text-[#FFFEF7] shadow-sm'
                        : 'bg-white border border-[rgba(21,21,21,0.1)] text-[#77736C] hover:text-[#151515]'
                    }`}
                    title={ic.label}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-30 hover:bg-[#252525] transition-all shadow-md"
            >
              {editingCollection ? 'Save Changes' : 'Create Collection'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-full text-sm font-medium text-[#77736C] hover:text-[#151515] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
