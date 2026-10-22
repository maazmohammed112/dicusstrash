import { useEffect, useState } from 'react';
import { Download, FileText, Paperclip, Loader2 } from 'lucide-react';
import { getAttachmentForItem } from '../db/repository';
import type { StoredAttachment } from '../types/stash';

export function FileAttachment({ itemId }: { itemId: string }) {
  const [attachment, setAttachment] = useState<StoredAttachment | null>(null);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setStatus('loading');
    setAttachment(null);
    setUrl('');
    getAttachmentForItem(itemId).then(file => {
      if (!active) return;
      if (!file) { setStatus('missing'); return; }
      objectUrl = URL.createObjectURL(file.dataBlob);
      setAttachment(file);
      setUrl(objectUrl);
      setStatus('ready');
    }).catch(() => { if (active) setStatus('error'); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [itemId]);

  if (status === 'loading') return <div className="attachment-message"><Loader2 size={18} className="animate-spin" />Loading local file…</div>;
  if (!attachment || !url) return <div className="attachment-message">{status === 'error' ? 'Could not read the file. Close and reopen this item to try again.' : 'This file is not available on this device. Upload it again to keep a local copy.'}</div>;

  const isImage = attachment.fileType.startsWith('image/') && attachment.fileType !== 'image/svg+xml';
  const isPdf = attachment.fileType === 'application/pdf';
  const size = attachment.fileSize >= 1024 * 1024 ? `${(attachment.fileSize / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(attachment.fileSize / 1024))} KB`;
  return (
    <section className="file-attachment" aria-label="Locally saved file">
      <div className="attachment-summary">
        <span className="attachment-icon">{isPdf ? <FileText size={22} /> : <Paperclip size={22} />}</span>
        <div className="attachment-info"><strong>{attachment.fileName}</strong><span>{size} / Saved on this device</span></div>
        <a className="attachment-download" href={url} download={attachment.fileName}><Download size={16} /><span>Download</span></a>
      </div>
      {isImage && <div className="attachment-image"><img src={url} alt={attachment.fileName} /></div>}
      {isPdf && <p className="attachment-caption">Your PDF is saved locally. Download it to view the original document.</p>}
    </section>
  );
}
