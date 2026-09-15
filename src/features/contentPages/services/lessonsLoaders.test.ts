import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Exercise the real React server cache with a request dispatcher, not a fake memoizer (same
// approach as loaders.test.ts, required because the loaders below are cache()-wrapped).
vi.mock('react', async () => {
  const { createRequire } = await import('node:module');
  const { dirname, join } = await import('node:path');
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve('react/package.json')), 'cjs/react.react-server.development.js'));
});
import {
  LESSONS_GROUPS, loadLessonsData, loadLessonsDetail, loadLessonsSingleList, loadLessonsSubscriptionList,
} from './lessonsLoaders';

const fetcher = vi.fn();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const priceItem = (slug: string, groupNames: string[], overrides: Partial<Record<string, unknown>> = {}) => ({
  id: '123e4567-e89b-42d3-a456-426614174000', name: `Tariff ${slug}`, slug,
  description: null, photos: [],
  groups: groupNames.map((name, index) => ({ id: `223e4567-e89b-42d3-a456-42661417400${index}`, name })),
  price_tables: [], ...overrides,
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('UT-SC-05/UT-SC-04: requests the "Разовые" group as-is, without any client-side slug filtering', async () => {
  fetcher.mockResolvedValueOnce(response({
    total: 2,
    items: [priceItem('individual-lesson-official', [LESSONS_GROUPS.single]), priceItem('group-lesson-official', [LESSONS_GROUPS.single])],
  }));
  const state = await loadLessonsSingleList();
  expect(state).toMatchObject({ status: 'success', data: [{ slug: 'individual-lesson-official' }, { slug: 'group-lesson-official' }] });
  const [url] = fetcher.mock.calls[0];
  expect(url).toContain(`groups=${encodeURIComponent(LESSONS_GROUPS.single)}`);
  expect(url).not.toContain('groups=%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D1%8B%D0%B5'); // never "Основные услуги"
  expect(url).toContain('limit=100');
});

it('UT-SC-05: requests the "Абонементы" group independently of the "Разовые" request', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 1, items: [priceItem('subscription-8-yandex', [LESSONS_GROUPS.subscription])] }));
  const state = await loadLessonsSubscriptionList();
  expect(state).toMatchObject({ status: 'success', data: [{ slug: 'subscription-8-yandex' }] });
  const [url] = fetcher.mock.calls[0];
  expect(url).toContain(`groups=${encodeURIComponent(LESSONS_GROUPS.subscription)}`);
});

it('UT-SC-05: loadLessonsData performs two separate group requests, never a repeatable groups= param', async () => {
  fetcher.mockResolvedValue(response({ total: 0, items: [] }));
  await loadLessonsData();
  const priceCalls = fetcher.mock.calls.map(([url]) => String(url)).filter((url) => url.includes('/prices?'));
  expect(priceCalls).toHaveLength(2);
  expect(priceCalls.some((url) => url.includes(`groups=${encodeURIComponent(LESSONS_GROUPS.single)}`) && !url.includes(`groups=${encodeURIComponent(LESSONS_GROUPS.subscription)}`))).toBe(true);
  expect(priceCalls.some((url) => url.includes(`groups=${encodeURIComponent(LESSONS_GROUPS.subscription)}`) && !url.includes(`groups=${encodeURIComponent(LESSONS_GROUPS.single)}`))).toBe(true);
});

it('merges both groups into one list, keyed by their own price_tables and slugs', async () => {
  fetcher.mockImplementation(async (url: string) => {
    if (String(url).includes(encodeURIComponent(LESSONS_GROUPS.single))) {
      return response({ total: 1, items: [priceItem('individual-lesson-official', [LESSONS_GROUPS.single])] });
    }
    if (String(url).includes(encodeURIComponent(LESSONS_GROUPS.subscription))) {
      return response({ total: 1, items: [priceItem('subscription-8-yandex', [LESSONS_GROUPS.subscription])] });
    }
    return response({ status: 'not-found' }, 404);
  });
  const data = await loadLessonsData();
  expect(data.prices).toMatchObject({ status: 'success', data: [{ slug: 'individual-lesson-official' }, { slug: 'subscription-8-yandex' }] });
});

it('UT-SC-07: reports empty (not error) when both groups come back with no items', async () => {
  fetcher.mockImplementation(async () => response({ total: 0, items: [] }));
  expect(await loadLessonsSingleList()).toEqual({ status: 'empty' });
  expect(await loadLessonsSubscriptionList()).toEqual({ status: 'empty' });
});

it.each([401, 500, 503])('UT-SC-08: keeps upstream %s as error for a group list', async (status) => {
  fetcher.mockResolvedValue(response({ detail: 'error' }, status));
  expect(await loadLessonsSingleList()).toEqual({ status: 'error', statusCode: status });
});

it('UT-SC-17: detail always calls the backend and 404s a tariff whose groups do not intersect the page\'s allowed groups', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('horse-boarding-yandex', ['Постой частных лошадей'])));
  expect(await loadLessonsDetail('horse-boarding-yandex')).toEqual({ status: 'not-found' });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toContain('/prices/horse-boarding-yandex');
});

it('UT-SC-17: detail also 404s a tariff still linked only to the deprecated "Основные услуги" group', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('training-package-8-official', ['Основные услуги'])));
  expect(await loadLessonsDetail('training-package-8-official')).toEqual({ status: 'not-found' });
});

it('UT-SC-17: detail renders a tariff belonging to either "Разовые" or "Абонементы"', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('individual-lesson-official', [LESSONS_GROUPS.single])));
  expect(await loadLessonsDetail('individual-lesson-official')).toMatchObject({ status: 'success', data: { slug: 'individual-lesson-official' } });
  fetcher.mockResolvedValueOnce(response(priceItem('subscription-8-yandex', [LESSONS_GROUPS.subscription])));
  expect(await loadLessonsDetail('subscription-8-yandex')).toMatchObject({ status: 'success', data: { slug: 'subscription-8-yandex' } });
});

it('detail: maps a backend 404 to not-found', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'Missing' }, 404));
  expect(await loadLessonsDetail('individual-lesson-official')).toEqual({ status: 'not-found' });
});

it('detail: keeps other upstream failures as error, distinct from not-found', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'error' }, 503));
  expect(await loadLessonsDetail('individual-lesson-official')).toEqual({ status: 'error', statusCode: 503 });
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
