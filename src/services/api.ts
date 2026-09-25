// API client that reads the file manifest and quiz list.
// In Phase 1 it consumes a static manifest.json.
// In Phase 2 (commit 012) it will be migrated to PocketBase.

import { z } from 'zod';

import { env } from '@/config/env';
import { categorySchema, fileMetadataSchema, quizDetailSchema, quizSummarySchema } from '@/types';

const MANIFEST_URL = `${env.apiUrl}/manifest.json`;

/** Error shape thrown by all API calls. */
export class ApiError extends Error {
  public readonly status?: number;
  public readonly cause?: unknown;

  constructor(message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.cause = cause;
  }
}

/** Root manifest schema expected from the server. */
const manifestSchema = z.object({
  categories: z.array(categorySchema),
  files: z.array(fileMetadataSchema),
  quizzes: z.array(quizSummarySchema),
});

export type Manifest = z.infer<typeof manifestSchema>;

/** Internal fetch helper with one automatic retry on network failure. */
async function fetchJson<T>(url: string, parse: (raw: unknown) => T, retries = 1): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new ApiError(`Request failed with status ${response.status}`, response.status);
      }

      const json: unknown = await response.json();
      return parse(json);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError('Network request failed', undefined, lastError);
}

/**
 * Fetches the full manifest.
 * Consumed by the app at startup and cached for offline access.
 */
export async function fetchManifest(): Promise<Manifest> {
  return fetchJson(MANIFEST_URL, (raw) => {
    const result = manifestSchema.safeParse(raw);
    if (!result.success) {
      throw new ApiError('Invalid manifest shape', undefined, result.error.flatten());
    }
    return result.data;
  });
}

/** Fetches the file list for a single category. */
export async function fetchFilesByCategory(categorySlug: string) {
  const manifest = await fetchManifest();
  return manifest.files.filter((f) => f.categorySlug === categorySlug);
}

/** Fetches the quiz list (summaries only), optionally by type. */
export async function fetchQuizSummaries(type?: string) {
  const manifest = await fetchManifest();
  return type ? manifest.quizzes.filter((q) => q.type === type) : manifest.quizzes;
}

/**
 * Fetches a single quiz with its full questions payload.
 * In Phase 1 the manifest does not include questions, so we request
 * a dedicated endpoint. In Phase 2 this becomes a PocketBase call.
 */
export async function fetchQuizDetail(quizId: string) {
  const url = `${env.apiUrl}/quizzes/${quizId}.json`;
  return fetchJson(url, (raw) => {
    const result = quizDetailSchema.safeParse(raw);
    if (!result.success) {
      throw new ApiError('Invalid quiz shape', undefined, result.error.flatten());
    }
    return result.data;
  });
}
