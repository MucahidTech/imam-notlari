import { z } from 'zod';

export const contactPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(10).max(2000),
});

export type ContactPayload = z.infer<typeof contactPayloadSchema>;
