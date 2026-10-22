import { describe, it, expect } from 'vitest';
import { validateBackupFile } from './backupService';

describe('backupService', () => {
  it('validates a valid discuss/stash backup JSON', async () => {
    const validJson = JSON.stringify({
      app: 'discuss/stash',
      version: 1,
      exportDate: Date.now(),
      items: [
        {
          id: 'test-1',
          type: 'link',
          title: 'Design Sprint',
          folderId: 'unsorted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      collections: [
        {
          id: 'unsorted',
          name: 'Unsorted',
          color: '#F6EDCF',
          icon: 'Folder',
          sortOrder: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      settings: {
        defaultFolderId: 'unsorted'
      }
    });

    const file = new File([validJson], 'backup.json', { type: 'application/json' });
    const result = await validateBackupFile(file);

    expect(result.isValid).toBe(true);
    expect(result.itemCount).toBe(1);
    expect(result.collectionCount).toBe(1);
  });

  it('rejects an invalid or alien JSON file', async () => {
    const invalidJson = JSON.stringify({
      app: 'unknown-app',
      data: [1, 2, 3]
    });

    const file = new File([invalidJson], 'random.json', { type: 'application/json' });
    const result = await validateBackupFile(file);

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Not a recognized discuss/stash backup');
  });

  it('rejects non-JSON or corrupted file', async () => {
    const corrupted = 'NOT_A_VALID_JSON{:::}}';
    const file = new File([corrupted], 'corrupt.json', { type: 'application/json' });
    const result = await validateBackupFile(file);

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Failed to parse file');
  });
});
