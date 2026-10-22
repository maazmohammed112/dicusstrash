import { useEffect, useState } from 'react';
import type { SavedItem } from '../types/stash';
import { PlatformIcon } from './PlatformIcon';
import { getPublicThumbnail } from '../services/platformDetector';
import { getAttachmentForItem } from '../db/repository';

export function ItemThumbnail({ item }: { item: SavedItem }) {
  const remote = item.thumbnailUrl || (item.originalUrl ? getPublicThumbnail(item.originalUrl) : undefined);
  const [local, setLocal] = useState('');
  const [failed, setFailed] = useState('');
  useEffect(() => {
    let active = true; let objectUrl = '';
    setLocal('');
    if (item.type === 'file') void getAttachmentForItem(item.id).then(file => {
      if (active && file?.fileType.startsWith('image/') && file.fileType !== 'image/svg+xml') {
        objectUrl = URL.createObjectURL(file.dataBlob); setLocal(objectUrl);
      }
    }).catch(() => {});
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.type]);
  const src = local || remote;
  return <span className={`item-thumbnail ${item.platform === 'maps' || item.type === 'location' ? 'thumbnail-map' : ''}`} aria-hidden="true">
    {src && src !== failed ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} /> : <PlatformIcon platform={item.platform} size={23} />}
  </span>;
}
