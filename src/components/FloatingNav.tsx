import React from 'react';
import { Home, Search, Plus, Folder } from 'lucide-react';

export type ActiveTab = 'home' | 'search' | 'collections';

interface FloatingNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAdd: () => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAdd
}) => {
  return (
    <nav
      className="floating-nav md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto pointer-events-auto"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div
        className="flex items-center gap-1.5 p-2 rounded-full liquid-glass shadow-2xl border border-[rgba(255,255,255,0.92)]"
        style={{
          boxShadow: '0 16px 44px rgba(21, 21, 21, 0.12), 0 2px 8px rgba(21, 21, 21, 0.04)'
        }}
      >
        {/* Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#151515] text-[#FFFEF7] shadow-sm'
              : 'text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF]'
          }`}
          title="Home"
        >
          <Home size={20} strokeWidth={activeTab === 'home' ? 2.4 : 1.8} />
        </button>

        {/* Search */}
        <button
          type="button"
          onClick={() => onTabChange('search')}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-[#151515] text-[#FFFEF7] shadow-sm'
              : 'text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF]'
          }`}
          title="Search"
        >
          <Search size={20} strokeWidth={activeTab === 'search' ? 2.4 : 1.8} />
        </button>

        {/* Prominent Circular Black ADD Button (Reference 1 & Reference 2 centerpiece) */}
        <button
          type="button"
          onClick={onOpenAdd}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#151515] text-[#FFFEF7] shadow-[0_6px_20px_rgba(21,21,21,0.28)] hover:bg-[#252525] active:scale-92 transition-all cursor-pointer mx-1 border border-[rgba(255,255,255,0.2)]"
          title="Add to Stash"
        >
          <Plus size={26} strokeWidth={2.6} />
        </button>

        {/* Collections */}
        <button
          type="button"
          onClick={() => onTabChange('collections')}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all cursor-pointer ${
            activeTab === 'collections'
              ? 'bg-[#151515] text-[#FFFEF7] shadow-sm'
              : 'text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF]'
          }`}
          title="Collections"
        >
          <Folder size={20} strokeWidth={activeTab === 'collections' ? 2.4 : 1.8} />
        </button>
      </div>
    </nav>
  );
};
