// Shared primitive types used across the domain.

/** Discriminated union for async operation state. */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

/** Standard result wrapper for operations that may fail. */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

/** Supported UI languages. */
export type Language = 'tr' | 'ar';

/** Supported theme modes. */
export type ThemeMode = 'light' | 'dark' | 'system';
