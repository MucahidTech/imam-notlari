import { ApiError, fetchFilesByCategory, fetchManifest, fetchQuizDetail } from '../api';

const validManifest = {
  categories: [
    {
      id: 'c1',
      slug: 'yokdil-arapca',
      nameTr: 'YÖKDİL Arapça',
      nameAr: 'يوكديل',
      order: 0,
      isActive: true,
    },
  ],
  files: [
    {
      id: 'f1',
      categorySlug: 'yokdil-arapca',
      driveId: 'drive-1',
      title: 'Grammar notes',
      description: 'desc',
      kind: 'pdf',
      order: 0,
    },
  ],
  quizzes: [
    {
      id: 'q1',
      type: 'kisa',
      title: 'Short quiz',
      durationMinutes: 45,
      questionCount: 20,
    },
  ],
};

const validQuizDetail = {
  ...validManifest.quizzes[0],
  questions: [
    {
      id: 'question-1',
      text: 'What is …?',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
    },
  ],
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('api service', () => {
  describe('fetchManifest', () => {
    it('returns a parsed manifest for a valid response', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => validManifest,
      })) as unknown as typeof fetch;

      const manifest = await fetchManifest();
      expect(manifest.categories).toHaveLength(1);
      expect(manifest.files[0].id).toBe('f1');
    });

    it('throws ApiError on non-200 responses', async () => {
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })) as unknown as typeof fetch;

      await expect(fetchManifest()).rejects.toBeInstanceOf(ApiError);
    });

    it('retries once on network failure, then succeeds', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validManifest,
        });

      global.fetch = mockFetch as unknown as typeof fetch;

      const manifest = await fetchManifest();
      expect(manifest.files).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws ApiError on invalid manifest shape', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ wrong: 'shape' }),
      })) as unknown as typeof fetch;

      await expect(fetchManifest()).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('fetchFilesByCategory', () => {
    it('filters the manifest by category slug', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => validManifest,
      })) as unknown as typeof fetch;

      const files = await fetchFilesByCategory('yokdil-arapca');
      expect(files).toHaveLength(1);
    });

    it('returns an empty array for a category with no files', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => validManifest,
      })) as unknown as typeof fetch;

      const files = await fetchFilesByCategory('diger');
      expect(files).toEqual([]);
    });
  });

  describe('fetchQuizDetail', () => {
    it('parses a valid quiz detail response', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => validQuizDetail,
      })) as unknown as typeof fetch;

      const quiz = await fetchQuizDetail('q1');
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].correctIndex).toBe(0);
    });

    it('throws ApiError on invalid quiz shape', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'q1' }),
      })) as unknown as typeof fetch;

      await expect(fetchQuizDetail('q1')).rejects.toBeInstanceOf(ApiError);
    });
  });
});
