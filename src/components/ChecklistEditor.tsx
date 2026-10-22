import React, { useState } from 'react';
import type { ChecklistItem, Collection } from '../types/stash';
import { Plus, X, Check, ArrowUp, ArrowDown, Folder } from 'lucide-react';

interface ChecklistEditorProps {
  initialTitle?: string;
  initialItems?: ChecklistItem[];
  initialFolderId?: string;
  collections: Collection[];
  onSave: (data: {
    title: string;
    checklist: ChecklistItem[];
    folderId: string;
  }) => void;
  onCancel: () => void;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  initialTitle = '',
  initialItems = [
    { id: '1', text: 'Buy food', completed: true },
    { id: '2', text: 'GYM session', completed: false },
    { id: '3', text: 'Review design system tokens', completed: false }
  ],
  initialFolderId = 'unsorted',
  collections,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [newItemText, setNewItemText] = useState('');
  const [folderId, setFolderId] = useState(initialFolderId);

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          return { ...item, completed: nextCompleted };
        }
        return item;
      })
    );
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newItemText.trim(),
      completed: false
    };
    setItems(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && items.length === 0) return;
    onSave({
      title: title.trim() || 'Checklist',
      checklist: items,
      folderId
    });
  };

  return (
    <form onSubmit={handleSave} className="checklist-editor flex flex-col gap-4">
      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Checklist title"
          autoFocus
          className="editor-title w-full text-xl sm:text-2xl font-bold text-[#151515] bg-transparent placeholder:text-[#A39E94] focus:outline-none tracking-tight border-b border-[rgba(21,21,21,0.08)] pb-2"
        />
      </div>

      {/* Checklist items list */}
      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="checklist-row flex items-center justify-between p-2.5 rounded-2xl bg-[#FFFEF7] border border-[rgba(21,21,21,0.08)] transition-all"
          >
            {/* Clean Circular Check Control */}
            <div
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  item.completed
                    ? 'bg-[#151515] border-[#151515] text-[#FFFEF7]'
                    : 'border-[rgba(21,21,21,0.3)] bg-white'
                }`}
              >
                {item.completed && <Check size={12} strokeWidth={3} />}
              </div>
              <span
                className={`text-sm font-medium truncate ${
                  item.completed ? 'line-through text-[#77736C]' : 'text-[#151515]'
                }`}
              >
                {item.text}
              </span>
            </div>

            {/* Actions: Reorder up/down and remove */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 text-[#77736C] hover:text-[#151515] disabled:opacity-20 cursor-pointer"
                title="Move up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="p-1 text-[#77736C] hover:text-[#151515] disabled:opacity-20 cursor-pointer"
                title="Move down"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="p-1 text-[#77736C] hover:text-[#F2755B] cursor-pointer"
                title="Remove item"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Checklist Item Input */}
      <div className="checklist-add-row flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          placeholder="Add an item..."
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem(e);
            }
          }}
          className="min-w-0 flex-1 px-4 py-2.5 rounded-full border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515]"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!newItemText.trim()}
          className="px-4 py-2.5 rounded-full bg-[#151515] text-[#FFFEF7] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>

      {/* Folder Picker */}
      <div>
        <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
          <Folder size={13} />
          <span>Folder</span>
        </label>
        <select
          value={folderId}
          onChange={e => setFolderId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs font-semibold text-[#151515] focus:outline-none cursor-pointer"
        >
          {collections.map(col => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      {/* Save / Cancel buttons */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="submit"
          disabled={items.length === 0 && !title.trim()}
          className="flex-1 py-3 px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-30 hover:bg-[#252525] transition-all shadow-md"
        >
          Save Checklist
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-3 px-5 rounded-full text-sm font-medium text-[#77736C] hover:text-[#151515] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
