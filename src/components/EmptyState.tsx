import React from 'react';
import { HandDrawnCircle } from './HandDrawnAccent';
import { Plus, FolderPlus, ArrowDownRight, Bookmark } from 'lucide-react';
interface EmptyStateProps { onAddLink: () => void; onCreateCollection?: () => void; }
export const EmptyState: React.FC<EmptyStateProps> = ({ onAddLink, onCreateCollection }) => (
  <section className="empty-state animate-fade-in">
    <div className="empty-intro">
      <span className="eyebrow">YOUR LIBRARY / A FRESH START</span>
      <h3>Your vault is quiet and ready for your first treasure.</h3>
      <p>Save links from Instagram, YouTube, X, Spotify, articles, or jot down thoughts. Everything stays here, 100% offline.</p>
      <div className="empty-actions">
        <button onClick={onAddLink} className="pill-btn pill-btn-black"><Plus size={18} />Save Your First Link</button>
        {onCreateCollection && <button onClick={onCreateCollection} className="pill-btn empty-secondary"><FolderPlus size={17} />New Collection</button>}
      </div>
    </div>
    <div className="empty-art" aria-hidden="true">
      <span className="empty-art-caption font-handwritten">a place for everything</span>
      <div className="paper-back" />
      <div className="paper-front"><Bookmark size={30} strokeWidth={1.2} /><HandDrawnCircle><span className="font-handwritten">clean canvas</span></HandDrawnCircle><ArrowDownRight size={32} strokeWidth={1} /></div>
    </div>
  </section>
);
