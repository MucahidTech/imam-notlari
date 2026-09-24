/* eslint-disable @typescript-eslint/no-require-imports */
// Global Jest setup — runs before each test suite.

import '@testing-library/jest-native/extend-expect';

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

// AsyncStorage mock — provided by the community package.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
