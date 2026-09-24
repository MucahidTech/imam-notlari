// Runtime environment variables with Zod validation.
// All variables MUST be prefixed with EXPO_PUBLIC_ to be exposed to the app.

import { z } from 'zod';

const envSchema = z.object({
  apiUrl: z.string().url(),
  telegramUsername: z.string().min(1),
  landingUrl: z.string().url(),
});

const raw = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  telegramUsername: process.env.EXPO_PUBLIC_TELEGRAM_USERNAME,
  landingUrl: process.env.EXPO_PUBLIC_LANDING_URL,
};

const parsed = envSchema.safeParse(raw);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. Check your .env file.');
}

export const env = parsed.data;
