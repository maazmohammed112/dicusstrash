import React, { useState } from 'react';
import type { Collection } from '../types/stash';
import { HighlightMarkerPin } from './HandDrawnAccent';
import { Highlighter, List, Tag, Folder } from 'lucide-react';

interface NotesEditorProps {
  initialTitle?: string;
  initialNote?: string;
  initialTags?: string[];
  initialFolderId?: string;
  collections: Collection[];
  onSave: (data: {
    title: string;
    note: string;
    tags: string[];
    folderId: string;
  }) => void;
  onCancel: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  initialTitle = '',
  initialNote = '',
  initialTags = [],
  initialFolderId = 'unsorted',
  collections,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [note, setNote] = useState(initialNote);
  const [tagsInput, setTagsInput] = useState(initialTags.join(', '));
  const [folderId, setFolderId] = useState(initialFolderId);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !note.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      title: title.trim() || 'Untitled Note',
      note: note.trim(),
      tags,
      folderId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="notes-editor flex flex-col gap-4">
      {/* Editorial Title Input */}
      <div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title"
          autoFocus
          className="editor-title w-full text-xl sm:text-2xl font-bold text-[#151515] bg-transparent placeholder:text-[#A39E94] focus:outline-none tracking-tight border-b border-[rgba(21,21,21,0.08)] pb-2"
        />
      </div>

      {/* Floating Mini Formatting Toolbar inspired by Reference 2/4 */}
      <div className="flex items-center gap-2 p-1.5 rounded-full liquid-glass border border-[rgba(255,255,255,0.9)] w-fit">
        <button
          type="button"
          onClick={() => setIsHighlighted(!isHighlighted)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isHighlighted ? 'bg-[#FFD76D] text-[#151515]' : 'text-[#77736C] hover:bg-[#F6EDCF]'
          }`}
          title="Toggle Warm Highlighter"
        >
          <Highlighter size={13} />
          <span>Highlight</span>
        </button>

        <div className="w-[1px] h-3.5 bg-[rgba(21,21,21,0.1)]" />

        <button
          type="button"
          onClick={() => {
            setNote(prev => prev + '\n- ');
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[#77736C] hover:bg-[#F6EDCF] transition-colors"
          title="Add Bullet Item"
        >
          <List size={13} />
          <span>List</span>
        </button>

        <span className="font-handwritten text-xs text-[#77736C] px-2 hidden sm:inline">
          editorial mode
        </span>
      </div>

      {/* Note Textarea with Optional Marker Highlight Style */}
      <div className="relative">
        {isHighlighted && (
          <div className="mb-2 p-3 rounded-2xl bg-[#FFE382] text-xs font-serif italic text-[#151515] flex items-center justify-between border border-[#E5C754]">
            <div>
              <HighlightMarkerPin position="start" />
              <span>Marker Highlight Active</span>
              <HighlightMarkerPin position="end" />
            </div>
            <span className="font-handwritten text-sm">warm ink</span>
          </div>
        )}

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write thoughts, quotes, article summaries, or meeting take-aways..."
          rows={6}
          className={`w-full p-4 rounded-2xl text-sm sm:text-base leading-relaxed bg-[#FFFDF6] border focus:outline-none focus:ring-2 focus:ring-[#151515] transition-all resize-y ${
            isHighlighted
              ? 'border-[#FFD76D] bg-[#FFFBEA]'
              : 'border-[rgba(21,21,21,0.1)]'
          }`}
        />
      </div>

      {/* Folder Picker & Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

        <div>
          <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
            <Tag size={13} />
            <span>Tags (comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="ideas, design, sprint"
            className="w-full px-3.5 py-2 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs text-[#151515] focus:outline-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="submit"
          disabled={!title.trim() && !note.trim()}
          className="flex-1 py-3 px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-30 hover:bg-[#252525] transition-all shadow-md"
        >
          Save Note
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
