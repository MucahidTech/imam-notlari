import { z } from 'zod';

// Category slugs are stable identifiers used in deep links and cache keys.
export const CATEGORY_SLUGS = [
  'yokdil-arapca',
  'imamlik-hazirlik',
  'ilahiyat-dersleri',
  'diger',
] as const;

export const categorySlugSchema = z.enum(CATEGORY_SLUGS);
export type CategorySlug = z.infer<typeof categorySlugSchema>;

export const categorySchema = z.object({
  id: z.string(),
  slug: categorySlugSchema,
  nameTr: z.string().min(1),
  nameAr: z.string().min(1),
  order: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export type Category = z.infer<typeof categorySchema>;
