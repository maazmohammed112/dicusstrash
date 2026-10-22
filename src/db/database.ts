import Dexie, { type Table } from 'dexie';
import type { SavedItem, Collection, StoredAttachment, AppSettings, StorageStats } from '../types/stash';

export class StashDatabase extends Dexie {
  items!: Table<SavedItem, string>;
  collections!: Table<Collection, string>;
  attachments!: Table<StoredAttachment, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('discuss_stash_db');

    this.version(1).stores({
      items: 'id, type, platform, folderId, isFavorite, isArchived, createdAt, updatedAt, normalizedUrl, *tags',
      collections: 'id, name, sortOrder, createdAt',
      attachments: 'id, itemId, createdAt',
      settings: 'key'
    });
  }
}

export const db = new StashDatabase();

// Seed initial default folder and settings on first initialization
export async function initializeDatabase(): Promise<void> {
  const unsortedExists = await db.collections.get('unsorted');
  if (!unsortedExists) {
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
  }

  // Pre-seed a few starter inspiring collections if database is fresh
  const count = await db.collections.count();
  if (count <= 1) {
    const starterCollections: Collection[] = [
      {
        id: 'lectures-ideas',
        name: 'Lectures & Ideas',
        description: 'Design sprints, product thinking, and talks',
        icon: 'BookOpen',
        color: '#FFD76D', // Butter yellow
        sortOrder: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'reading-list',
        name: 'Reading List',
        description: 'Articles, essays, and deep dives',
        icon: 'Bookmark',
        color: '#F2755B', // Soft Coral
        sortOrder: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'design-inspiration',
        name: 'Design Inspiration',
        description: 'Visual references, typography, and UI patterns',
        icon: 'Sparkles',
        color: '#BFD9F8', // Powder Blue
        sortOrder: 3,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'places-travel',
        name: 'Places to Go',
        description: 'Cafes, architecture, and travel pins',
        icon: 'Compass',
        color: '#B4E8C2', // Mint
        sortOrder: 4,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    for (const col of starterCollections) {
      await db.collections.put(col);
    }
  }

  // Initialize default settings if missing
  const defaultSettings = await db.settings.get('app_settings');
  if (!defaultSettings) {
    const settings: AppSettings = {
      defaultFolderId: 'unsorted',
      showQuickEditOnShare: true,
      includeShareSignature: true,
      autoFetchPreviews: true,
      enableMotion: true
    };
    await db.settings.put({ key: 'app_settings', value: settings });
  }

  // Request persistent storage if supported by browser
  requestPersistentStorage();
}

// Request persistent storage from browser
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

// Compute comprehensive storage diagnostics
export async function computeStorageStats(): Promise<StorageStats> {
  const items = await db.items.toArray();
  const collections = await db.collections.toArray();
  const attachments = await db.attachments.toArray();

  let attachmentBytes = 0;
  for (const att of attachments) {
    if (att.dataBlob) {
      attachmentBytes += att.dataBlob.size || 0;
    }
  }

  // Approximate item storage
  const serializedItems = JSON.stringify(items);
  const serializedCollections = JSON.stringify(collections);
  const jsonBytes = new Blob([serializedItems, serializedCollections]).size;

  let totalNotes = 0;
  let totalLinks = 0;
  let totalChecklists = 0;
  let totalLocations = 0;
  let totalFiles = 0;

  for (const item of items) {
    if (item.type === 'note') totalNotes++;
    else if (item.type === 'link') totalLinks++;
    else if (item.type === 'checklist') totalChecklists++;
    else if (item.type === 'location') totalLocations++;
    else if (item.type === 'file') totalFiles++;
  }

  return {
    totalItems: items.length,
    totalCollections: collections.length,
    totalNotes,
    totalLinks,
    totalChecklists,
    totalLocations,
    totalFiles,
    attachmentStorageBytes: attachmentBytes,
    estimatedTotalBytes: attachmentBytes + jsonBytes
  };
}
