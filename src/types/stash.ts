// Data Types for discuss/stash

export type ItemType = 'link' | 'note' | 'checklist' | 'location' | 'file';

export type PlatformType =
  | 'facebook'
  | 'snapchat'
  | 'whatsapp'
  | 'telegram'
  | 'linkedin'
  | 'tiktok'
  | 'discord'
  | 'instagram'
  | 'threads'
  | 'x'
  | 'youtube'
  | 'spotify'
  | 'maps'
  | 'github'
  | 'reddit'
  | 'pinterest'
  | 'website'
  | 'note'
  | 'checklist'
  | 'location'
  | 'file';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface LocationData {
  placeName: string;
  address?: string;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedItem {
  id: string;
  type: ItemType;
  originalUrl?: string;
  normalizedUrl?: string;
  title: string;
  description?: string;
  note?: string;
  platform: PlatformType;
  sourceHost?: string;
  thumbnailUrl?: string; // Preview image URL or data URI
  metadataStatus?: 'pending' | 'success' | 'fallback';
  folderId: string; // 'unsorted' or collection id
  tags: string[];
  isFavorite: boolean;
  pinnedAt?: number;
  isArchived: boolean;
  checklist?: ChecklistItem[];
  locationData?: LocationData;
  attachmentId?: string; // ID referencing attachment in attachment table
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
  archivedAt?: number;
  publishedAt?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon name, e.g. 'Folder', 'BookOpen', 'Compass', etc.
  color: string; // Theme pastel color hex: e.g. '#FFD76D', '#F2755B', '#BFD9F8', '#DCCCF5', '#B4E8C2', '#F6EDCF'
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoredAttachment {
  id: string;
  itemId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataBlob: Blob;
  createdAt: number;
}

export interface AppSettings {
  defaultFolderId: string;
  showQuickEditOnShare: boolean;
  includeShareSignature: boolean;
  autoFetchPreviews: boolean;
  enableMotion: boolean;
  lastBackupDate?: number;
}

export interface StorageStats {
  totalItems: number;
  totalCollections: number;
  totalNotes: number;
  totalLinks: number;
  totalChecklists: number;
  totalLocations: number;
  totalFiles: number;
  attachmentStorageBytes: number;
  estimatedTotalBytes: number;
}

export interface ExportDataPackage {
  app: 'discuss/stash';
  version: 1 | 2;
  attachments?: (Omit<StoredAttachment, 'dataBlob'> & { base64: string })[];
  exportDate: number;
  items: SavedItem[];
  collections: Collection[];
  settings: AppSettings;
}
