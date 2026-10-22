import React from 'react';
import type { ActiveTab } from './FloatingNav';
import { Home, Search, Folder, Plus, Settings, Bookmark, HardDrive } from 'lucide-react';
interface DesktopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAdd: () => void;
  onOpenSettings: () => void;
  itemCount: number;
}
export const DesktopNav: React.FC<DesktopNavProps> = ({ activeTab, onTabChange, onOpenAdd, onOpenSettings, itemCount }) => (
  <div className="desktop-nav">
    <button className="brand-lockup" onClick={() => onTabChange('home')} aria-label="discuss/stash home">
      <span className="brand-symbol"><Bookmark size={23} /></span>
      <span>discuss<span className="brand-slash">/</span>stash</span>
    </button>
    <nav className="desktop-tabs" aria-label="Main navigation">
      {([{ id: 'home', label: 'Vault Home', icon: Home }, { id: 'search', label: 'Search & Filter', icon: Search }, { id: 'collections', label: 'Collections', icon: Folder }] as const).map(({ id, label, icon: Icon }) => (
        <button key={id} className={activeTab === id ? 'nav-tab active' : 'nav-tab'} onClick={() => onTabChange(id)} aria-current={activeTab === id ? 'page' : undefined}>
          <Icon size={17} /><span>{label}</span>
        </button>
      ))}
    </nav>
    <div className="desktop-actions">
      <span className="local-count" title="Stored locally on this device"><HardDrive size={15} />{itemCount} items</span>
      <button className="icon-btn-circle" onClick={onOpenSettings} aria-label="Settings & Backup"><Settings size={19} /></button>
      <button className="pill-btn pill-btn-black" onClick={onOpenAdd}><Plus size={18} />New Item</button>
    </div>
  </div>
);
