// Storage service over expo-file-system.
// Handles downloading, listing, and deleting files on the device.

import * as FileSystem from 'expo-file-system/legacy';

const FILES_DIR = `${FileSystem.documentDirectory}files/`;

/** Metadata persisted for each downloaded file. */
export interface LocalFileMeta {
  id: string;
  localUri: string;
  sizeBytes: number;
  downloadedAt: number;
  title: string;
}

/** Progress callback shape used while downloading. */
export type DownloadProgressCallback = (progress: {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}) => void;

/** Ensures the files directory exists. */
async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(FILES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(FILES_DIR, { intermediates: true });
  }
}

/** Builds the local URI for a file id. */
function buildFileUri(fileId: string): string {
  return `${FILES_DIR}${fileId}.bin`;
}

/**
 * Downloads a remote file to local storage.
 * Returns the local URI on success.
 */
export async function downloadFile(
  fileId: string,
  remoteUrl: string,
  onProgress?: DownloadProgressCallback
): Promise<string> {
  await ensureDir();

  const localUri = buildFileUri(fileId);

  // Remove any stale file first to avoid partial overwrites.
  const existing = await FileSystem.getInfoAsync(localUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUrl,
    localUri,
    {},
    onProgress
      ? (data) => {
          onProgress({
            totalBytesWritten: data.totalBytesWritten,
            totalBytesExpectedToWrite: data.totalBytesExpectedToWrite,
          });
        }
      : undefined
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error(`Download failed for file: ${fileId}`);
  }

  return result.uri;
}

/** Checks whether a file is downloaded locally. */
export async function fileExists(fileId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(buildFileUri(fileId));
  return info.exists;
}

/** Returns the local URI for a downloaded file, or null if missing. */
export async function getLocalUri(fileId: string): Promise<string | null> {
  const uri = buildFileUri(fileId);
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? uri : null;
}

/** Deletes a single downloaded file. Safe if file is missing. */
export async function deleteFile(fileId: string): Promise<void> {
  const uri = buildFileUri(fileId);
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

/** Deletes all downloaded files. */
export async function deleteAllFiles(): Promise<void> {
  const info = await FileSystem.getInfoAsync(FILES_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(FILES_DIR, { idempotent: true });
  }
  await ensureDir();
}

/** Lists all downloaded file ids (without extensions). */
export async function listDownloadedIds(): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(FILES_DIR);
  if (!info.exists) return [];

  const entries = await FileSystem.readDirectoryAsync(FILES_DIR);
  return entries.filter((name) => name.endsWith('.bin')).map((name) => name.replace(/\.bin$/, ''));
}

/** Returns the size (bytes) of a downloaded file, or 0 if missing. */
export async function getFileSize(fileId: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(buildFileUri(fileId));
  if (!info.exists) return 0;
  return (info as FileSystem.FileInfo & { size?: number }).size ?? 0;
}

/** Exposed for tests and callers that need the base directory. */
export const FILES_DIRECTORY = FILES_DIR;
