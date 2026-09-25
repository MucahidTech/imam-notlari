import * as FileSystem from 'expo-file-system/legacy';
import {
  FILES_DIRECTORY,
  deleteAllFiles,
  deleteFile,
  downloadFile,
  fileExists,
  getFileSize,
  getLocalUri,
  listDownloadedIds,
} from '../storage';

// The mock factory hoisted by Babel cannot access outer-scope variables,
// so we use a shared store exposed via the mocked module itself.
jest.mock('expo-file-system/legacy', () => {
  const store = new Map<string, { size: number }>();

  const normalizeDir = (dir: string) => (dir.endsWith('/') ? dir : `${dir}/`);

  return {
    documentDirectory: 'file:///mock-docs/',
    getInfoAsync: jest.fn(async (uri: string) => {
      if (uri.endsWith('/')) {
        const prefix = normalizeDir(uri);
        const hasChild = Array.from(store.keys()).some((k) => k.startsWith(prefix));
        return { exists: hasChild };
      }
      const entry = store.get(uri);
      return entry ? { exists: true, size: entry.size, uri } : { exists: false };
    }),
    makeDirectoryAsync: jest.fn(async () => undefined),
    deleteAsync: jest.fn(async (uri: string) => {
      const prefix = normalizeDir(uri);
      Array.from(store.keys())
        .filter((k) => k === uri || k.startsWith(prefix))
        .forEach((k) => store.delete(k));
    }),
    readDirectoryAsync: jest.fn(async (dir: string) => {
      const prefix = normalizeDir(dir);
      return Array.from(store.keys())
        .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
        .map((k) => k.slice(prefix.length));
    }),
    createDownloadResumable: jest.fn(
      (
        _url: string,
        localUri: string,
        _opts: unknown,
        onProgress?: (data: {
          totalBytesWritten: number;
          totalBytesExpectedToWrite: number;
        }) => void
      ) => ({
        downloadAsync: jest.fn(async () => {
          store.set(localUri, { size: 1024 });
          onProgress?.({
            totalBytesWritten: 512,
            totalBytesExpectedToWrite: 1024,
          });
          onProgress?.({
            totalBytesWritten: 1024,
            totalBytesExpectedToWrite: 1024,
          });
          return { uri: localUri };
        }),
      })
    ),
    // Test-only escape hatch.
    __reset: () => store.clear(),
  };
});

// Typed access to the mock-only reset function.
const mockFileSystem = FileSystem as unknown as { __reset: () => void };

beforeEach(() => {
  mockFileSystem.__reset();
  jest.clearAllMocks();
});

describe('storage service', () => {
  describe('downloadFile', () => {
    it('downloads a file and returns its local URI', async () => {
      const uri = await downloadFile('abc', 'https://example.com/abc.pdf');

      expect(uri).toBe(`${FILES_DIRECTORY}abc.bin`);
      expect(await fileExists('abc')).toBe(true);
    });

    it('reports progress through the callback', async () => {
      const onProgress = jest.fn();
      await downloadFile('abc', 'https://example.com/abc.pdf', onProgress);

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenLastCalledWith({
        totalBytesWritten: 1024,
        totalBytesExpectedToWrite: 1024,
      });
    });

    it('overwrites a pre-existing file with the same id', async () => {
      await downloadFile('abc', 'https://example.com/v1.pdf');
      await downloadFile('abc', 'https://example.com/v2.pdf');

      const ids = await listDownloadedIds();
      expect(ids).toEqual(['abc']);
    });
  });

  describe('fileExists / getLocalUri / getFileSize', () => {
    it('returns false/null/0 for a missing file', async () => {
      expect(await fileExists('missing')).toBe(false);
      expect(await getLocalUri('missing')).toBeNull();
      expect(await getFileSize('missing')).toBe(0);
    });

    it('returns the correct values for an existing file', async () => {
      await downloadFile('abc', 'https://example.com/abc.pdf');

      expect(await fileExists('abc')).toBe(true);
      expect(await getLocalUri('abc')).toBe(`${FILES_DIRECTORY}abc.bin`);
      expect(await getFileSize('abc')).toBe(1024);
    });
  });

  describe('deleteFile', () => {
    it('removes a single file and leaves others intact', async () => {
      await downloadFile('a', 'https://example.com/a.pdf');
      await downloadFile('b', 'https://example.com/b.pdf');

      await deleteFile('a');

      expect(await fileExists('a')).toBe(false);
      expect(await fileExists('b')).toBe(true);
    });

    it('is safe when the file does not exist', async () => {
      await expect(deleteFile('missing')).resolves.toBeUndefined();
    });
  });

  describe('deleteAllFiles', () => {
    it('removes every downloaded file', async () => {
      await downloadFile('a', 'https://example.com/a.pdf');
      await downloadFile('b', 'https://example.com/b.pdf');

      await deleteAllFiles();

      expect(await listDownloadedIds()).toEqual([]);
    });

    it('recreates the base directory after clearing', async () => {
      await deleteAllFiles();
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(FILES_DIRECTORY, {
        intermediates: true,
      });
    });
  });

  describe('listDownloadedIds', () => {
    it('returns an empty array when nothing is downloaded', async () => {
      expect(await listDownloadedIds()).toEqual([]);
    });

    it('returns only .bin files', async () => {
      await downloadFile('a', 'https://example.com/a.pdf');
      await downloadFile('b', 'https://example.com/b.pdf');

      const ids = await listDownloadedIds();
      expect(ids.sort()).toEqual(['a', 'b']);
    });
  });
});
