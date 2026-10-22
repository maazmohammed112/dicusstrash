import { db } from './database';
import type { SavedItem, Collection, StoredAttachment, AppSettings, ItemType } from '../types/stash';

// Generate UUID-like unique stable ID
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// ITEMS REPOSITORY

export async function getRecentItems(limit: number = 5): Promise<SavedItem[]> {
  return await db.items
    .where('isArchived')
    .equals(0) // 0 for false in Dexie index
    .reverse()
    .sortBy('createdAt')
    .then(items => items.slice(0, limit));
}

export async function getAllItems(): Promise<SavedItem[]> {
  return await db.items.orderBy('createdAt').reverse().toArray();
}

export async function getItemById(id: string): Promise<SavedItem | undefined> {
  return await db.items.get(id);
}

export async function getItemsByFolder(folderId: string): Promise<SavedItem[]> {
  return await db.items
    .where('folderId')
    .equals(folderId)
    .and(item => !item.isArchived)
    .reverse()
    .sortBy('createdAt');
}

export async function getItems(options?: {
  folderId?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  type?: ItemType;
  platform?: string;
  searchQuery?: string;
}): Promise<SavedItem[]> {
  let collection = db.items.toCollection();

  let items = await collection.toArray();

  // Filter in memory for multi-condition flexibility
  if (options) {
    if (options.isArchived !== undefined) {
      items = items.filter(i => Boolean(i.isArchived) === options.isArchived);
    } else {
      // Default to non-archived unless specifically asked
      items = items.filter(i => !i.isArchived);
    }

    if (options.isFavorite !== undefined) {
      items = items.filter(i => Boolean(i.isFavorite) === options.isFavorite);
    }

    if (options.folderId) {
      items = items.filter(i => i.folderId === options.folderId);
    }

    if (options.type) {
      items = items.filter(i => i.type === options.type);
    }

    if (options.platform) {
      items = items.filter(i => i.platform === options.platform);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      items = items.filter(i => {
        return (
          i.title?.toLowerCase().includes(q) ||
          i.originalUrl?.toLowerCase().includes(q) ||
          i.note?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.platform?.toLowerCase().includes(q) ||
          i.tags?.some(tag => tag.toLowerCase().includes(q)) ||
          i.checklist?.some(c => c.text.toLowerCase().includes(q)) ||
          i.locationData?.placeName.toLowerCase().includes(q) ||
          i.locationData?.address?.toLowerCase().includes(q)
        );
      });
    }
  }

  // Sort descending by createdAt
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function findDuplicateUrl(normalizedUrl: string): Promise<SavedItem | undefined> {
  if (!normalizedUrl) return undefined;
  return await db.items
    .where('normalizedUrl')
    .equals(normalizedUrl)
    .first();
}

export async function addItem(itemData: Omit<SavedItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedItem> {
  const now = Date.now();
  const newItem: SavedItem = {
    ...itemData,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  };

  await db.items.put(newItem);
  return newItem;
}

export async function updateItem(id: string, updates: Partial<SavedItem>): Promise<SavedItem | undefined> {
  return db.transaction('rw', db.items, async () => {
    const existing = await db.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    if (updated.pinnedAt && !updated.isArchived && (updated.folderId !== existing.folderId || !existing.pinnedAt)) {
      const count = await db.items.where('folderId').equals(updated.folderId).and(row => row.id !== id && Boolean(row.pinnedAt) && !row.isArchived).count();
      if (count >= 5) throw new Error('This folder already has five pinned items. Unpin one first.');
    }
    await db.items.put(updated);
    return updated;
  });
}

export async function togglePin(id: string): Promise<SavedItem | undefined> {
  return db.transaction('rw', db.items, async () => {
    const item = await db.items.get(id);
    if (!item) return undefined;
    if (item.isArchived) throw new Error('Restore this item before pinning it.');
    if (!item.pinnedAt) {
      const count = await db.items.where('folderId').equals(item.folderId).and(row => Boolean(row.pinnedAt) && !row.isArchived).count();
      if (count >= 5) throw new Error('You can pin up to five items in this folder. Unpin one first.');
    }
    const updated = { ...item, pinnedAt: item.pinnedAt ? undefined : Date.now(), updatedAt: Date.now() };
    await db.items.put(updated);
    return updated;
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const item = await db.items.get(id);
  if (!item) return false;
  const newFavorite = !item.isFavorite;
  await updateItem(id, { isFavorite: newFavorite });
  return newFavorite;
}

export async function toggleArchive(id: string): Promise<boolean> {
  const item = await db.items.get(id);
  if (!item) return false;
  const newArchive = !item.isArchived;
  await updateItem(id, {
    isArchived: newArchive,
    pinnedAt: undefined,
    archivedAt: newArchive ? Date.now() : undefined
  });
  return newArchive;
}

export async function deleteItem(id: string): Promise<void> {
  const item = await db.items.get(id);
  if (item && item.attachmentId) {
    await db.attachments.delete(item.attachmentId);
  }
  await db.items.delete(id);
}

export async function deleteMultipleItems(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteItem(id);
  }
}

export async function moveItemsToFolder(itemIds: string[], targetFolderId: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.items, async () => {
    for (const id of itemIds) {
      const item = await db.items.get(id);
      if (item) {
        if (item.pinnedAt && item.folderId !== targetFolderId) {
          const count = await db.items.where('folderId').equals(targetFolderId).and(row => Boolean(row.pinnedAt) && !row.isArchived).count();
          if (count >= 5) throw new Error('The destination already has five pinned items. Unpin this item before moving it.');
        }
        await db.items.put({
          ...item,
          folderId: targetFolderId,
          updatedAt: now
        });
      }
    }
  });
}

// COLLECTIONS REPOSITORY

export async function getCollections(): Promise<Collection[]> {
  const collections = await db.collections.orderBy('sortOrder').toArray();
  return collections;
}

export async function getCollectionById(id: string): Promise<Collection | undefined> {
  return await db.collections.get(id);
}

export async function addCollection(data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> & { sortOrder?: number }): Promise<Collection> {
  const now = Date.now();
  const count = await db.collections.count();
  const newCol: Collection = {
    ...data,
    id: generateId(),
    sortOrder: data.sortOrder ?? count,
    createdAt: now,
    updatedAt: now
  };
  await db.collections.put(newCol);
  return newCol;
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | undefined> {
  const existing = await db.collections.get(id);
  if (!existing) return undefined;

  const updated: Collection = {
    ...existing,
    ...updates,
    updatedAt: Date.now()
  };

  await db.collections.put(updated);
  return updated;
}

export async function deleteCollection(
  collectionId: string,
  mode: 'move-to-unsorted' | 'delete-all'
): Promise<void> {
  if (collectionId === 'unsorted') {
    throw new Error('The default Unsorted collection cannot be deleted.');
  }

  const itemsInCollection = await db.items.where('folderId').equals(collectionId).toArray();

  if (mode === 'move-to-unsorted') {
    const now = Date.now();
    for (const item of itemsInCollection) {
      await db.items.put({
        ...item,
        folderId: 'unsorted',
        pinnedAt: undefined,
        updatedAt: now
      });
    }
  } else if (mode === 'delete-all') {
    for (const item of itemsInCollection) {
      if (item.attachmentId) {
        await db.attachments.delete(item.attachmentId);
      }
      await db.items.delete(item.id);
    }
  }

  await db.collections.delete(collectionId);
}

export async function getItemCountByFolder(folderId: string): Promise<number> {
  return await db.items
    .where('folderId')
    .equals(folderId)
    .and(i => !i.isArchived)
    .count();
}

// ATTACHMENT REPOSITORY

export async function saveAttachment(itemId: string, file: File): Promise<StoredAttachment> {
  const attachment: StoredAttachment = {
    id: generateId(),
    itemId,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    dataBlob: file,
    createdAt: Date.now()
  };

  await db.transaction('rw', db.items, db.attachments, async () => {
    const item = await db.items.get(itemId);
    if (!item) throw new Error('The saved item could not be found.');
    await db.attachments.put(attachment);
    await db.items.update(itemId, { attachmentId: attachment.id, updatedAt: Date.now() });
  });
  return attachment;
}

export async function getAttachment(id: string): Promise<StoredAttachment | undefined> {
  return await db.attachments.get(id);
}

// Resolve older saved uploads that were stored without an attachmentId as well.
export async function getAttachmentForItem(itemId: string): Promise<StoredAttachment | undefined> {
  return db.attachments.where('itemId').equals(itemId).first();
}

// SETTINGS REPOSITORY

export async function getAppSettings(): Promise<AppSettings> {
  const record = await db.settings.get('app_settings');
  if (record && record.value) {
    return record.value;
  }
  return {
    defaultFolderId: 'unsorted',
    showQuickEditOnShare: true,
    includeShareSignature: true,
    autoFetchPreviews: true,
    enableMotion: true
  };
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings
  };
  await db.settings.put({ key: 'app_settings', value: updated });
  return updated;
}

// ERASE ALL DATA

export async function eraseEntireDatabase(): Promise<void> {
  await db.transaction('rw', db.items, db.collections, db.attachments, db.settings, async () => {
  await db.items.clear();
  await db.collections.clear();
  await db.attachments.clear();
  await db.settings.clear();
  // Reseed unsorted collection
  await db.collections.put({
    id: 'unsorted',
    name: 'Unsorted',
    description: 'Default vault for links and notes waiting to be filed',
    icon: 'Inbox',
    color: '#F6EDCF',
    sortOrder: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  });
}
