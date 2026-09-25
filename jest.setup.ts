/* eslint-disable @typescript-eslint/no-require-imports */
// Global Jest setup — runs before each test suite.

import '@testing-library/jest-native/extend-expect';

require('dotenv').config({ quiet: true });
// Silence Reanimated warnings in tests.
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence Expo modules that aren't essential in unit tests.
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// In-memory AsyncStorage mock — works reliably across pnpm and Expo SDK 57.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
      getAllKeys: jest.fn(async () => Array.from(store.keys())),
      multiGet: jest.fn(async (keys: string[]) =>
        keys.map((k) => [k, store.get(k) ?? null] as [string, string | null])
      ),
      multiSet: jest.fn(async (entries: [string, string][]) => {
        entries.forEach(([k, v]) => store.set(k, v));
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => store.delete(k));
      }),
    },
  };
});
