import React from 'react';
import { Settings, Bookmark, CheckCheck } from 'lucide-react';
interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAdd?: () => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}
export const Header: React.FC<HeaderProps> = ({ onOpenSettings, isSelectionMode = false, onToggleSelectionMode }) => (
  <header className="page-header">
    <div className="mobile-brand brand-lockup"><Bookmark size={23} /><span>discuss/stash</span></div>
    <span className="header-caption">Save anything. Find everything.</span>
    <div className="header-controls">
      {onToggleSelectionMode && <button className={`selection-button ${isSelectionMode ? 'selected' : ''}`} onClick={onToggleSelectionMode}><CheckCheck size={16} />{isSelectionMode ? 'Done' : 'Select items'}</button>}
      <button className="mobile-settings icon-btn-circle" onClick={onOpenSettings} aria-label="Settings & Storage"><Settings size={18} /></button>
    </div>
  </header>
);
