import React from 'react';
import type { Collection } from '../types/stash';
import { Search, X, Folder } from 'lucide-react';

export type CategoryFilter = 'all' | 'link' | 'note' | 'checklist' | 'location' | 'file' | 'favorite' | 'archived';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: CategoryFilter;
  onFilterChange: (f: CategoryFilter) => void;
  collections: Collection[];
  selectedFolderId: string;
  onFolderChange: (folderId: string) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
}

const FILTER_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'link', label: 'Links' },
  { id: 'note', label: 'Notes' },
  { id: 'checklist', label: 'Checklists' },
  { id: 'location', label: 'Locations' },
  { id: 'file', label: 'Files' },
  { id: 'favorite', label: 'Favorites' },
  { id: 'archived', label: 'Archived' }
];

const PLATFORMS: { id: string; label: string }[] = [
  { id: '', label: 'All Sources' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'discord', label: 'Discord' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'threads', label: 'Threads' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'github', label: 'GitHub' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'maps', label: 'Google Maps' },
  { id: 'website', label: 'Websites' }
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  collections,
  selectedFolderId,
  onFolderChange,
  selectedPlatform,
  onPlatformChange
}) => {
  return (
    <div className="search-filters w-full flex flex-col gap-3.5 mb-6">
      {/* Search Bar */}
      <div className="relative flex items-center w-full px-4 py-3 rounded-full liquid-glass border border-[rgba(255,255,255,0.9)] shadow-sm focus-within:border-[#151515] transition-all">
        <Search size={18} className="text-[#77736C] mr-3 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, url, note, tag, or place..."
          className="flex-1 bg-transparent text-sm sm:text-base text-[#151515] placeholder:text-[#77736C] font-medium focus:outline-none min-w-0"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-1 rounded-full text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] transition-colors ml-2"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Responsive filter grid: labels stay inside their buttons at every width. */}
      <div className="filter-categories">
        {FILTER_PILLS.map((pill) => {
          const isActive = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onFilterChange(pill.id)}
              aria-pressed={isActive}
              className={`filter-pill transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#151515] text-[#FFFEF7] shadow-sm'
                  : 'bg-[#FFFEF7] text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] border border-[rgba(21,21,21,0.08)]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Sub-filters: Folder & Platform Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {/* Folder Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFEF7] border border-[rgba(21,21,21,0.08)] text-[#77736C]">
          <Folder size={13} className="text-[#151515]" />
          <select
            value={selectedFolderId}
            onChange={(e) => onFolderChange(e.target.value)}
            className="bg-transparent font-medium text-[#151515] focus:outline-none cursor-pointer"
          >
            <option value="">All Collections</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Select */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFEF7] border border-[rgba(21,21,21,0.08)] text-[#77736C]">
          <span className="font-medium text-[#151515]">Source:</span>
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="bg-transparent font-medium text-[#151515] focus:outline-none cursor-pointer"
          >
            {PLATFORMS.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters shortcut if any sub-filter is active */}
        {(selectedFolderId || selectedPlatform || activeFilter !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onFilterChange('all');
              onFolderChange('');
              onPlatformChange('');
            }}
            className="text-xs font-semibold text-[#F2755B] hover:underline px-2 py-1 ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
