import { db } from '../db/database';
import { getAllItems, getCollections, getAppSettings } from '../db/repository';
import { normalizeUrl } from './platformDetector';
import type { ExportDataPackage, StoredAttachment } from '../types/stash';

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
  const [items, collections, settings] = await Promise.all([getAllItems(), getCollections(), getAppSettings()]);
  const attachments: NonNullable<ExportDataPackage['attachments']> = [];
  for (const id of await db.attachments.toCollection().primaryKeys()) {
    const file = await db.attachments.get(id); if (!file) continue;
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
export async function executeRestore(data: ExportDataPackage, mode: 'merge' | 'replace'): Promise<{ restoredItems: number; restoredCollections: number }> {
  // Decode before changing existing data. The transaction rolls back on errors or quota exhaustion.
  const attachments: StoredAttachment[] = (data.attachments || []).map(({ base64, ...file }) => ({ ...file, dataBlob: fromBase64(base64, file.fileType || 'application/octet-stream') }));
  let restoredItems = 0; let restoredCollections = 0;
  await db.transaction('rw', db.items, db.collections, db.attachments, db.settings, async () => {
    if (mode === 'replace') await Promise.all([db.items.clear(), db.collections.clear(), db.attachments.clear(), db.settings.clear()]);
    for (const col of data.collections) if (!(await db.collections.get(col.id))) { await db.collections.put(col); restoredCollections++; }
    if (!(await db.collections.get('unsorted'))) await db.collections.put({ id: 'unsorted', name: 'Unsorted', icon: 'Inbox', color: '#F6EDCF', sortOrder: 0, createdAt: Date.now(), updatedAt: Date.now() });
    for (const item of data.items) if (!(await db.items.get(item.id))) {
      if (!(await db.collections.get(item.folderId))) item.folderId = 'unsorted';
      await db.items.put(item); restoredItems++;
    }
    for (const file of attachments) if (await db.items.get(file.itemId)) {
      if (!(await db.attachments.get(file.id))) await db.attachments.put(file);
      await db.items.update(file.itemId, { attachmentId: file.id });
    }
    if (data.settings) await db.settings.put({ key: 'app_settings', value: { ...data.settings, defaultFolderId: 'unsorted' } });
  });
  return { restoredItems, restoredCollections };
}
