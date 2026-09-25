// Deep link builders and parsers.
// Custom scheme: imamnotlari://
// HTTPS landing page: https://imamnotlari.app

import * as Linking from 'expo-linking';

import { env } from '@/config/env';

const APP_SCHEME = 'imamnotlari';

/** Supported in-app destinations. */
export type DeepLinkTarget =
  | { kind: 'home' }
  | { kind: 'category'; slug: string }
  | { kind: 'file'; fileId: string }
  | { kind: 'quiz'; quizId: string };

/** Builds a custom-scheme URL for a target. */
export function buildCustomLink(target: DeepLinkTarget): string {
  switch (target.kind) {
    case 'home':
      return `${APP_SCHEME}://`;
    case 'category':
      return `${APP_SCHEME}://category/${encodeURIComponent(target.slug)}`;
    case 'file':
      return `${APP_SCHEME}://file/${encodeURIComponent(target.fileId)}`;
    case 'quiz':
      return `${APP_SCHEME}://quiz/${encodeURIComponent(target.quizId)}`;
  }
}

/** Builds the HTTPS landing-page URL used for sharing. */
export function buildLandingLink(target: DeepLinkTarget): string {
  const base = env.landingUrl.replace(/\/$/, '');
  switch (target.kind) {
    case 'home':
      return base;
    case 'category':
      return `${base}/category/${encodeURIComponent(target.slug)}`;
    case 'file':
      return `${base}/file/${encodeURIComponent(target.fileId)}`;
    case 'quiz':
      return `${base}/quiz/${encodeURIComponent(target.quizId)}`;
  }
}

/**
 * Parses an incoming URL (custom scheme or HTTPS) into a deep link target.
 * Returns null if the URL is not recognized.
 */
export function parseDeepLink(url: string): DeepLinkTarget | null {
  const parsed = Linking.parse(url);

  // `path` may be null (e.g., imamnotlari://).
  const path = parsed.path ?? '';

  // Strip leading/trailing slashes.
  const cleanPath = path.replace(/^\/+|\/+$/g, '');

  if (!cleanPath) return { kind: 'home' };

  const [segment, value] = cleanPath.split('/');

  if (segment === 'category' && value) {
    return { kind: 'category', slug: decodeURIComponent(value) };
  }
  if (segment === 'file' && value) {
    return { kind: 'file', fileId: decodeURIComponent(value) };
  }
  if (segment === 'quiz' && value) {
    return { kind: 'quiz', quizId: decodeURIComponent(value) };
  }

  return null;
}
