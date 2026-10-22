import { db } from '../db/database';
import { getAllItems, getCollections, getAppSettings, generateId } from '../db/repository';
import { normalizeUrl } from './platformDetector';
import type { ExportDataPackage, SavedItem, Collection } from '../types/stash';

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
});
const fromBase64 = (value: string, type: string) => {
  const decoded = atob(value); const parts: ArrayBuffer[] = [];
  for (let offset = 0; offset < decoded.length; offset += 65536) {
    const part = decoded.slice(offset, offset + 65536); const bytes = new Uint8Array(part.length); for (let i = 0; i < part.length; i++) bytes[i] = part.charCodeAt(i); parts.push(bytes.buffer);
  }
  return new Blob(parts, { type });
};
export async function exportDataToJson(): Promise<void> {
  const [items, collections, settings, files] = await db.transaction('r', db.items, db.collections, db.attachments, db.settings, async () => Promise.all([getAllItems(), getCollections(), getAppSettings(), db.attachments.toArray()]));
  const attachments: NonNullable<ExportDataPackage['attachments']> = [];
  for (const file of files) {
    const { dataBlob, ...metadata } = file;
    attachments.push({ ...metadata, base64: await toBase64(dataBlob) });
  }
  const data: ExportDataPackage = { app: 'discuss/stash', version: 2, exportDate: Date.now(), items, collections, settings, attachments };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `discuss-stash-backup-${new Date().toISOString().slice(0,10)}.json`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export interface ImportValidationResult { isValid: boolean; itemCount: number; collectionCount: number; packageData?: ExportDataPackage; errorMessage?: string; }
export async function validateBackupFile(file: File): Promise<ImportValidationResult> {
  try {
    const data = JSON.parse(await file.text()) as ExportDataPackage;
    if (data.app !== 'discuss/stash' || ![1,2].includes(data.version) || !Array.isArray(data.items) || !Array.isArray(data.collections)) throw new Error('This is not a supported discuss/stash backup.');
    const types = ['link','note','file','location','checklist'];
    if (data.items.some(item => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.folderId !== 'string' || !types.includes(item.type))) throw new Error('The backup contains invalid saved items.');
    if (data.collections.some(col => !col || typeof col.id !== 'string' || typeof col.name !== 'string')) throw new Error('The backup contains invalid collections.');
    for (const item of data.items) {
      if (item.originalUrl) item.originalUrl = normalizeUrl(item.originalUrl);
      if (item.locationData?.mapsUrl) item.locationData.mapsUrl = normalizeUrl(item.locationData.mapsUrl);
    }
    if (data.attachments && (!Array.isArray(data.attachments) || data.attachments.some(file => !file || typeof file.id !== 'string' || typeof file.itemId !== 'string' || typeof file.fileName !== 'string' || typeof file.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)))) throw new Error('The backup contains invalid attachments.');
    return { isValid: true, itemCount: data.items.length, collectionCount: data.collections.length, packageData: data };
  } catch (error) { return { isValid: false, itemCount: 0, collectionCount: 0, errorMessage: (error as Error).message || 'Could not read the backup.' }; }
}
export interface RestoreResult {
  restoredItems: number;
  restoredCollections: number;
  restoredAttachments: number;
  skippedItems: number;
  skippedUrls: number;
  reusedCollections: number;
  keptInCurrentFolder: number;
  folderConflicts: { title: string; currentFolder: string; incomingFolder: string }[];
}

const folderKey = (name: string) => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
function itemUrlKey(item: SavedItem): string | undefined {
  const value = item.originalUrl || item.locationData?.mapsUrl || (item.type === 'link' ? item.normalizedUrl : undefined);
  if (!value) return undefined;
  try {
    const url = new URL(normalizeUrl(value));
    url.searchParams.sort();
    return url.toString();
  } catch { return undefined; }
}

export async function executeRestore(data: ExportDataPackage, mode: 'merge' | 'replace'): Promise<RestoreResult> {
  const result: RestoreResult = { restoredItems: 0, restoredCollections: 0, restoredAttachments: 0, skippedItems: 0, skippedUrls: 0, reusedCollections: 0, keptInCurrentFolder: 0, folderConflicts: [] };
  await db.transaction('rw', db.items, db.collections, db.attachments, db.settings, async () => {
    if (mode === 'replace') await Promise.all([db.items.clear(), db.collections.clear(), db.attachments.clear(), db.settings.clear()]);
    const localFolders = await db.collections.toArray();
    const foldersById = new Map(localFolders.map(folder => [folder.id, folder]));
    const foldersByName = new Map<string, Collection>();
    for (const folder of localFolders) if (!foldersByName.has(folderKey(folder.name))) foldersByName.set(folderKey(folder.name), folder);
    if (!foldersById.has('unsorted')) {
      const unsorted: Collection = { id: 'unsorted', name: 'Unsorted', icon: 'Inbox', color: '#F6EDCF', sortOrder: 0, createdAt: Date.now(), updatedAt: Date.now() };
      await db.collections.add(unsorted); foldersById.set(unsorted.id, unsorted); foldersByName.set(folderKey(unsorted.name), unsorted);
    }
    const folderIds = new Map<string, string>();
    let nextOrder = Math.max(0, ...localFolders.map(folder => folder.sortOrder || 0)) + 1;
    for (const incoming of data.collections) {
      const existing = foldersById.get(incoming.id) || foldersByName.get(folderKey(incoming.name));
      if (existing) { folderIds.set(incoming.id, existing.id); result.reusedCollections++; continue; }
      const folder = { ...incoming, sortOrder: nextOrder++ };
      await db.collections.add(folder);
      foldersById.set(folder.id, folder); foldersByName.set(folderKey(folder.name), folder); folderIds.set(incoming.id, folder.id);
      result.restoredCollections++;
    }
    const localItems = await db.items.toArray();
    const itemsById = new Map(localItems.map(item => [item.id, item]));
    const itemsByUrl = new Map<string, SavedItem>();
    const pinCounts = new Map<string, number>();
    for (const item of localItems) {
      const key = itemUrlKey(item); if (key && !itemsByUrl.has(key)) itemsByUrl.set(key, item);
      if (item.pinnedAt && !item.isArchived) pinCounts.set(item.folderId, (pinCounts.get(item.folderId) || 0) + 1);
    }
    // Only new files or existing file items missing an original may receive attachments.
    const attachmentTargets = new Map<string, string>();
    for (const incoming of data.items) {
      const destination = folderIds.get(incoming.folderId) || (foldersById.has(incoming.folderId) ? incoming.folderId : 'unsorted');
      const key = itemUrlKey(incoming);
      const duplicate = key ? itemsByUrl.get(key) : itemsById.get(incoming.id);
      if (duplicate) {
        result.skippedItems++;
        if (!key && incoming.type === 'file' && duplicate.type === 'file' && !(await db.attachments.where('itemId').equals(duplicate.id).count())) attachmentTargets.set(incoming.id, duplicate.id);
        if (key) {
          result.skippedUrls++;
          if (duplicate.folderId !== destination) {
            result.keptInCurrentFolder++;
            if (result.folderConflicts.length < 20) result.folderConflicts.push({ title: /^https?:\/\//i.test(duplicate.title) ? 'Saved link' : duplicate.title, currentFolder: foldersById.get(duplicate.folderId)?.name || 'Unsorted', incomingFolder: foldersById.get(destination)?.name || 'Unsorted' });
          }
        }
        continue;
      }
      // A colliding ID must not overwrite a different local URL.
      const id = itemsById.has(incoming.id) ? generateId() : incoming.id;
      const pinCount = pinCounts.get(destination) || 0;
      const item: SavedItem = { ...incoming, id, folderId: destination, attachmentId: undefined, pinnedAt: incoming.pinnedAt && !incoming.isArchived && pinCount < 5 ? incoming.pinnedAt : undefined };
      if (item.pinnedAt) pinCounts.set(destination, pinCount + 1);
      await db.items.add(item);
      itemsById.set(id, item); if (key) itemsByUrl.set(key, item);
      if (item.type === 'file') attachmentTargets.set(incoming.id, id);
      result.restoredItems++;
    }
    for (const incoming of data.attachments || []) {
      const itemId = attachmentTargets.get(incoming.itemId);
      if (!itemId || (await db.attachments.where('itemId').equals(itemId).count())) continue;
      const { base64, ...metadata } = incoming;
      const dataBlob = fromBase64(base64, metadata.fileType || 'application/octet-stream');
      const id = await db.attachments.get(metadata.id) ? generateId() : metadata.id;
      await db.attachments.add({ ...metadata, id, itemId, fileSize: dataBlob.size, dataBlob });
      await db.items.update(itemId, { attachmentId: id });
      result.restoredAttachments++;
    }
    // A merge never imports another device's preferences over this device's settings.
    if (mode === 'replace' && data.settings) await db.settings.put({ key: 'app_settings', value: { ...data.settings, defaultFolderId: 'unsorted' } });
  });
  return result;
}
