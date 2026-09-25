// Runs BEFORE any test module is loaded (via `setupFiles`).
// Guarantees that process.env is populated before env.ts is evaluated,
// especially in CI where .env does not exist.

require('dotenv').config({ quiet: true });

// Safe defaults — used when .env is absent (e.g., in CI).
process.env.EXPO_PUBLIC_API_URL ??= 'https://test.example.com';
process.env.EXPO_PUBLIC_TELEGRAM_USERNAME ??= 'test_admin';
process.env.EXPO_PUBLIC_LANDING_URL ??= 'https://imamnotlari.app';
