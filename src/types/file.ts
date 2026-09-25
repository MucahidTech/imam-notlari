import { z } from 'zod';
import { categorySlugSchema } from './category';

// File kinds supported by the viewer.
export const FILE_KINDS = ['pdf', 'presentation'] as const;
export const fileKindSchema = z.enum(FILE_KINDS);
export type FileKind = z.infer<typeof fileKindSchema>;

// Server-side file descriptor (metadata only, no local state).
export const fileMetadataSchema = z.object({
  id: z.string(),
  categorySlug: categorySlugSchema,
  driveId: z.string(),
  title: z.string().min(1),
  description: z.string().default(''),
  kind: fileKindSchema,
  sizeBytes: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().default(0),
  updatedAt: z.string().datetime().optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

// Client-side file item combines metadata with local download state.
export interface FileItem extends FileMetadata {
  isDownloaded: boolean;
  localUri?: string;
  downloadedAt?: number;
  lastOpenedAt?: number;
}
