import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Exercise the real React server cache with a request dispatcher, not a fake memoizer (same
// approach as loaders.test.ts, required because loadLessonsList/loadLessonsDetail are cache()-wrapped).
vi.mock('react', async () => {
  const { createRequire } = await import('node:module');
  const { dirname, join } = await import('node:path');
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve('react/package.json')), 'cjs/react.react-server.development.js'));
});
import { loadLessonsData, loadLessonsDetail, loadLessonsList, LESSONS_ALLOWED_SLUGS } from './lessonsLoaders';

const fetcher = vi.fn();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const priceItem = (slug: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id: '123e4567-e89b-42d3-a456-426614174000', name: `Tariff ${slug}`, slug,
  description: null, photos: [], groups: [{ id: '223e4567-e89b-42d3-a456-426614174000', name: 'Основные услуги' }],
  price_tables: [], ...overrides,
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('keeps only allow-listed slugs from the group response and requests the group + a wide page', async () => {
  fetcher.mockResolvedValueOnce(response({
    total: 3,
    items: [priceItem(LESSONS_ALLOWED_SLUGS[0]), priceItem('horse-boarding-yandex'), priceItem(LESSONS_ALLOWED_SLUGS[1])],
  }));
  const state = await loadLessonsList();
  expect(state).toMatchObject({ status: 'success', data: [{ slug: LESSONS_ALLOWED_SLUGS[0] }, { slug: LESSONS_ALLOWED_SLUGS[1] }] });
  const [url] = fetcher.mock.calls[0];
  expect(url).toContain('groups=%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D1%8B%D0%B5+%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8');
  expect(url).toContain('limit=100');
});

it('reports empty when none of the allow-listed slugs come back', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 1, items: [priceItem('horse-boarding-yandex')] }));
  expect(await loadLessonsList()).toEqual({ status: 'empty' });
});

it.each([401, 500, 503])('keeps upstream %s as error for the list', async (status) => {
  fetcher.mockResolvedValue(response({ detail: 'error' }, status));
  expect(await loadLessonsList()).toEqual({ status: 'error', statusCode: status });
});

it('detail: renders a valid own-page slug even without calling the group list endpoint', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem(LESSONS_ALLOWED_SLUGS[0])));
  expect(await loadLessonsDetail(LESSONS_ALLOWED_SLUGS[0])).toMatchObject({ status: 'success', data: { slug: LESSONS_ALLOWED_SLUGS[0] } });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toContain(`/prices/${LESSONS_ALLOWED_SLUGS[0]}`);
});

it('detail: 404s a slug outside the allow-list without ever calling the backend', async () => {
  expect(await loadLessonsDetail('horse-boarding-yandex')).toEqual({ status: 'not-found' });
  expect(fetcher).not.toHaveBeenCalled();
});

it('detail: maps a backend 404 for an allow-listed slug to not-found', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'Missing' }, 404));
  expect(await loadLessonsDetail(LESSONS_ALLOWED_SLUGS[0])).toEqual({ status: 'not-found' });
});

it('detail: keeps other upstream failures as error, distinct from not-found', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'error' }, 503));
  expect(await loadLessonsDetail(LESSONS_ALLOWED_SLUGS[0])).toEqual({ status: 'error', statusCode: 503 });
});

it('does not request removed page settings while preserving the price failure', async () => {
  fetcher.mockImplementation(async (url: string) => url.includes('site_settings')
    ? response([{ key: 'services.notice', type: 'string', value: 'Оплата на месте' }])
    : response({ detail: 'Unavailable' }, 503));
  const data = await loadLessonsData();
  expect(data.settings).toEqual({ status: 'empty' });
  expect(fetcher.mock.calls.some(([url]) => String(url).includes('site_settings'))).toBe(false);
  expect(data.prices).toEqual({ status: 'error', statusCode: 503 });
});
