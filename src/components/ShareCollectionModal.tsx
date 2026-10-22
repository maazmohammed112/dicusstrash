import { useState } from 'react';
import { X, Copy, Share2, Download, MessageCircle } from 'lucide-react';
import type { Collection, SavedItem } from '../types/stash';
import { buildCollectionMessage, shareText } from '../services/shareService';
import { useModalLifecycle } from '../hooks/useModalLifecycle';
interface Props { collection: Collection; items: SavedItem[]; includeSignature: boolean; onClose: () => void; }
export function ShareCollectionModal({ collection, items, includeSignature, onClose }: Props) {
  useModalLifecycle(true, onClose);
  const [notice, setNotice] = useState('');
  const text = buildCollectionMessage(collection.name, items, includeSignature);
  const count = items.filter(item => item.originalUrl || item.locationData?.mapsUrl).length;
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${collection.name.replace(/[^a-z0-9_-]/gi, '_')}-links.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal-panel share-collection-modal" role="dialog" aria-modal="true" aria-label="Share collection" tabIndex={-1}>
      <div className="flex items-start justify-between gap-4"><div><h2>Share your collection</h2><p className="share-caption">{collection.name} / {count} {count === 1 ? 'link' : 'links'}</p></div><button className="icon-btn-circle" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
      <div className="modal-scroll">
        <p className="share-caption">One message with titles, sources and every saved URL. Choose an app from your device’s share sheet, or copy the message.</p>
        <textarea className="share-message" readOnly value={text} aria-label="Collection share message" rows={9} />
        <div className="collection-share-actions">
          <button className="pill-btn pill-btn-black" disabled={!count} onClick={async () => { const result = await shareText(collection.name, text); setNotice(result.success ? result.method === 'clipboard' ? 'Message copied. Paste it into your preferred app.' : 'Share sheet opened.' : 'Share was cancelled or unavailable. You can select and copy the message above.'); }}><Share2 size={17} />Share</button>
          <button className="pill-btn empty-secondary" disabled={!count} onClick={async () => { try { await navigator.clipboard.writeText(text); setNotice('All links copied.'); } catch { setNotice('Select and copy the message above.'); } }}><Copy size={17} />Copy all</button>
          <button className="pill-btn empty-secondary" disabled={!count} onClick={download}><Download size={17} />Text file</button>
          {count > 0 && text.length < 6000 && <a className="pill-btn empty-secondary" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} />WhatsApp</a>}
        </div>
        {text.length >= 6000 && <p className="share-caption">For a large collection, use Copy all or Text file to keep the complete message.</p>}
        {notice && <p className="share-notice" role="status">{notice}</p>}
      </div>
    </section>
  </div>;
}
