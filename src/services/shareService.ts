import { addItem, findDuplicateUrl, getAppSettings } from '../db/repository';
import { inspectUrl, extractUrlsFromText, PLATFORM_LABELS } from './platformDetector';
import type { SavedItem } from '../types/stash';

export interface IncomingSharePayload { url?: string; title?: string; text?: string; }
export interface InboundShareResult {
  status: 'saved' | 'duplicate' | 'error'; item?: SavedItem; existingItem?: SavedItem; message?: string; savedCount?: number;
}

export async function handleIncomingShare(payload: IncomingSharePayload): Promise<InboundShareResult> {
  const urls = extractUrlsFromText([payload.url, payload.text, payload.title].filter(Boolean).join('\n'));
  if (!urls.length) {
    const note = [payload.title, payload.text].filter(Boolean).join('\n').trim();
    if (!note) return { status: 'error', message: 'No content received.' };
    const item = await addItem({ type: 'note', title: payload.title?.trim() || 'Shared Note', note, platform: 'note', folderId: 'unsorted', tags: ['shared'], isFavorite: false, isArchived: false });
    return { status: 'saved', item, savedCount: 1 };
  }
  let lastItem: SavedItem | undefined;
  let existingItem: SavedItem | undefined;
  let savedCount = 0;
  for (const url of urls) {
    const info = await inspectUrl(url);
    const duplicate = await findDuplicateUrl(info.normalizedUrl);
    if (duplicate) { existingItem = duplicate; continue; }
    lastItem = await addItem({ type: 'link', originalUrl: info.normalizedUrl, normalizedUrl: info.normalizedUrl, title: urls.length === 1 && payload.title?.trim() && !extractUrlsFromText(payload.title).length ? payload.title.trim() : info.derivedTitle, description: payload.text && payload.text !== url ? payload.text : undefined, platform: info.platform, sourceHost: info.sourceHost, metadataStatus: 'fallback', folderId: 'unsorted', tags: ['shared'], isFavorite: false, isArchived: false });
    savedCount++;
  }
  return savedCount ? { status: 'saved', item: lastItem, savedCount } : { status: 'duplicate', existingItem, message: 'These links are already saved.' };
}

export function buildCollectionMessage(name: string, items: SavedItem[], includeSignature = true): string {
  const links = items.filter(item => Boolean(item.originalUrl || item.locationData?.mapsUrl));
  const entries = links.map((item, index) => `${index + 1}. ${item.title || 'Saved link'}\n${PLATFORM_LABELS[item.platform] || 'Website'}\n${item.originalUrl || item.locationData?.mapsUrl}`);
  return [`${name}\n${links.length} saved ${links.length === 1 ? 'link' : 'links'}`, ...entries, ...(includeSignature ? ['Saved with discuss/stash'] : [])].join('\n\n');
}

export async function shareText(title: string, text: string): Promise<{ method: 'native' | 'clipboard'; success: boolean }> {
  const bridge = (window as any).median || (window as any).gonative;
  if (bridge?.share?.sharePage) {
    try { bridge.share.sharePage({ title, text }); return { method: 'native', success: true }; } catch { /* Use web sharing below. */ }
  }
  if (navigator.share) {
    try { await navigator.share({ title, text }); return { method: 'native', success: true }; }
    catch (error) { if ((error as Error).name === 'AbortError') return { method: 'native', success: false }; }
  }
  try { await navigator.clipboard.writeText(text); return { method: 'clipboard', success: true }; }
  catch { return { method: 'clipboard', success: false }; }
}

export async function shareSavedItem(item: SavedItem): Promise<{ method: 'native' | 'clipboard'; success: boolean }> {
  const settings = await getAppSettings();
  const url = item.originalUrl || item.locationData?.mapsUrl;
  const text = [item.title || 'Saved item', url || item.note || item.checklist?.map(check => `${check.completed ? '[x]' : '[ ]'} ${check.text}`).join('\n') || '', ...(settings.includeShareSignature ? ['Saved with discuss/stash'] : [])].filter(Boolean).join('\n\n');
  return shareText(item.title || 'Saved item', text);
}
