import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CACHE_DEFAULT_TTL_MS,
  clearAllCache,
  getCache,
  getCacheAge,
  invalidateCache,
  setCache,
} from '../cache';

// AsyncStorage mock is set up globally in jest.setup.ts.

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('cache service', () => {
  describe('setCache / getCache', () => {
    it('writes and reads a value round-trip', async () => {
      await setCache('files', [{ id: 'a' }]);

      const result = await getCache<{ id: string }[]>('files');

      expect(result).not.toBeNull();
      expect(result?.data).toEqual([{ id: 'a' }]);
      expect(result?.isStale).toBe(false);
    });

    it('returns null for a missing key', async () => {
      const result = await getCache('does-not-exist');
      expect(result).toBeNull();
    });

    it('namespaces keys with the cache: prefix', async () => {
      const spy = jest.spyOn(AsyncStorage, 'setItem');
      await setCache('x', 1);

      expect(spy).toHaveBeenCalledWith('cache:x', expect.any(String));
    });

    it('marks entries as stale after TTL expires', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await setCache('short', 'v', 1000);

      // Advance time beyond TTL.
      jest.spyOn(Date, 'now').mockReturnValue(now + 5000);

      const result = await getCache<string>('short');

      expect(result?.isStale).toBe(true);
      expect(result?.ageMs).toBe(5000);
    });

    it('uses the default TTL when none is provided', async () => {
      await setCache('default-ttl', 'v');
      const spy = jest.spyOn(AsyncStorage, 'setItem');

      await setCache('default-ttl', 'v2');

      const call = spy.mock.calls.find(([k]) => k === 'cache:default-ttl');
      expect(call).toBeDefined();

      const payload = JSON.parse(call![1] as string);
      expect(payload.ttlMs).toBe(CACHE_DEFAULT_TTL_MS);
    });

    it('returns null when the stored JSON is corrupted', async () => {
      await AsyncStorage.setItem('cache:broken', '{not-json');

      const result = await getCache('broken');

      expect(result).toBeNull();
    });

    it('returns null when the shape is invalid', async () => {
      await AsyncStorage.setItem('cache:shape', JSON.stringify({ foo: 'bar' }));

      const result = await getCache('shape');

      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('removes a single key', async () => {
      await setCache('to-remove', 'v');
      await invalidateCache('to-remove');

      const result = await getCache('to-remove');
      expect(result).toBeNull();
    });

    it('does not affect other keys', async () => {
      await setCache('a', 1);
      await setCache('b', 2);

      await invalidateCache('a');

      expect(await getCache('a')).toBeNull();
      expect((await getCache<number>('b'))?.data).toBe(2);
    });
  });

  describe('clearAllCache', () => {
    it('removes only cache: entries', async () => {
      await setCache('one', 1);
      await setCache('two', 2);
      await AsyncStorage.setItem('settings:theme', 'dark');

      await clearAllCache();

      expect(await getCache('one')).toBeNull();
      expect(await getCache('two')).toBeNull();
      expect(await AsyncStorage.getItem('settings:theme')).toBe('dark');
    });

    it('is safe when there is nothing to clear', async () => {
      await expect(clearAllCache()).resolves.toBeUndefined();
    });
  });

  describe('getCacheAge', () => {
    it('returns null for a missing key', async () => {
      expect(await getCacheAge('missing')).toBeNull();
    });

    it('returns a positive age for existing entries', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await setCache('aged', 'v');
      jest.spyOn(Date, 'now').mockReturnValue(now + 3000);

      expect(await getCacheAge('aged')).toBe(3000);
    });
  });
});
