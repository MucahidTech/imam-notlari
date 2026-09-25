import * as Linking from 'expo-linking';

import { buildCustomLink, buildLandingLink, parseDeepLink } from '../deepLinks';

// A complete ParsedURL mock — SDK 57 requires all four fields.
const mockParsedURL = (path: string, scheme: string | null = 'imamnotlari') => ({
  scheme,
  hostname: scheme ? null : 'imamnotlari.app',
  path,
  queryParams: {},
});

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
  createURL: jest.fn(),
}));

const mockedParse = Linking.parse as jest.MockedFunction<typeof Linking.parse>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deep links service', () => {
  describe('buildCustomLink', () => {
    it('builds the home link', () => {
      expect(buildCustomLink({ kind: 'home' })).toBe('imamnotlari://');
    });

    it('builds a category link', () => {
      expect(buildCustomLink({ kind: 'category', slug: 'yokdil-arapca' })).toBe(
        'imamnotlari://category/yokdil-arapca'
      );
    });

    it('builds a file link', () => {
      expect(buildCustomLink({ kind: 'file', fileId: 'abc-123' })).toBe(
        'imamnotlari://file/abc-123'
      );
    });

    it('encodes special characters', () => {
      expect(buildCustomLink({ kind: 'file', fileId: 'a/b c' })).toBe(
        'imamnotlari://file/a%2Fb%20c'
      );
    });
  });

  describe('buildLandingLink', () => {
    it('builds the home landing link', () => {
      expect(buildLandingLink({ kind: 'home' })).toBe('https://imamnotlari.app');
    });

    it('builds a file landing link', () => {
      expect(buildLandingLink({ kind: 'file', fileId: 'abc-123' })).toBe(
        'https://imamnotlari.app/file/abc-123'
      );
    });
  });

  describe('parseDeepLink', () => {
    it('parses a home link', () => {
      mockedParse.mockReturnValue(mockParsedURL(''));
      expect(parseDeepLink('imamnotlari://')).toEqual({ kind: 'home' });
    });

    it('parses a category link', () => {
      mockedParse.mockReturnValue(mockParsedURL('category/yokdil-arapca'));
      expect(parseDeepLink('imamnotlari://category/yokdil-arapca')).toEqual({
        kind: 'category',
        slug: 'yokdil-arapca',
      });
    });

    it('parses a file link', () => {
      mockedParse.mockReturnValue(mockParsedURL('file/abc-123'));
      expect(parseDeepLink('imamnotlari://file/abc-123')).toEqual({
        kind: 'file',
        fileId: 'abc-123',
      });
    });

    it('parses a quiz link', () => {
      mockedParse.mockReturnValue(mockParsedURL('quiz/q1'));
      expect(parseDeepLink('imamnotlari://quiz/q1')).toEqual({
        kind: 'quiz',
        quizId: 'q1',
      });
    });

    it('returns null for an unrecognized path', () => {
      mockedParse.mockReturnValue(mockParsedURL('unknown/thing'));
      expect(parseDeepLink('imamnotlari://unknown/thing')).toBeNull();
    });

    it('handles HTTPS landing URLs', () => {
      mockedParse.mockReturnValue({
        scheme: 'https',
        hostname: 'imamnotlari.app',
        path: 'file/abc-123',
        queryParams: {},
      });
      expect(parseDeepLink('https://imamnotlari.app/file/abc-123')).toEqual({
        kind: 'file',
        fileId: 'abc-123',
      });
    });
  });
});
