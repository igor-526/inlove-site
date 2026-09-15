import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Exercise the real React server cache with a request dispatcher, not a fake memoizer (same
// approach as lessonsLoaders.test.ts, required because loadBoardingList/loadBoardingDetail are cache()-wrapped).
vi.mock('react', async () => {
  const { createRequire } = await import('node:module');
  const { dirname, join } = await import('node:path');
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve('react/package.json')), 'cjs/react.react-server.development.js'));
});
import { BOARDING_GROUP, loadBoardingData, loadBoardingDetail, loadBoardingList } from './boardingLoaders';

const fetcher = vi.fn();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const priceItem = (slug: string, name: string, groupNames: string[] = [BOARDING_GROUP], overrides: Partial<Record<string, unknown>> = {}) => ({
  id: '123e4567-e89b-42d3-a456-426614174000', name, slug,
  description: null, photos: [],
  groups: groupNames.map((groupName, index) => ({ id: `223e4567-e89b-42d3-a456-42661417400${index}`, name: groupName })),
  price_tables: [], ...overrides,
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('UT-SC-06: requests the "Постой частных лошадей" group via groups=, not a name= filter', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 1, items: [priceItem('horse-boarding-yandex', 'Постой частных лошадей')] }));
  const state = await loadBoardingList();
  expect(state).toMatchObject({ status: 'success', data: [{ slug: 'horse-boarding-yandex' }] });
  const [url] = fetcher.mock.calls[0];
  expect(url).toContain(`groups=${BOARDING_GROUP.split(' ').map(encodeURIComponent).join('+')}`);
  expect(url).not.toContain('name=');
  expect(url).toContain('limit=100');
});

it('UT-SC-04: trusts the backend group response one-to-one, without any client-side slug filtering', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 1, items: [priceItem('some-other-slug', 'Другой постой')] }));
  const state = await loadBoardingList();
  expect(state).toMatchObject({ status: 'success', data: [{ slug: 'some-other-slug' }] });
});

it('reports empty when the group comes back with no items', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 0, items: [] }));
  expect(await loadBoardingList()).toEqual({ status: 'empty' });
});

it.each([401, 500, 503])('keeps upstream %s as error for the list', async (status) => {
  fetcher.mockResolvedValue(response({ detail: 'error' }, status));
  expect(await loadBoardingList()).toEqual({ status: 'error', statusCode: status });
});

it('detail: always calls the backend and renders a tariff whose groups include "Постой частных лошадей"', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('horse-boarding-yandex', 'Постой частных лошадей')));
  expect(await loadBoardingDetail('horse-boarding-yandex')).toMatchObject({ status: 'success', data: { slug: 'horse-boarding-yandex' } });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toContain('/prices/horse-boarding-yandex');
});

it('UT-SC-17: detail 404s a tariff belonging to another page\'s group instead of a hardcoded slug array', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('horse-rides-official', 'Прогулка', ['Прогулки'])));
  expect(await loadBoardingDetail('horse-rides-official')).toEqual({ status: 'not-found' });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('UT-SC-17: detail 404s a tariff still linked only to the deprecated "Основные услуги" group', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('legacy-boarding', 'Старый постой', ['Основные услуги'])));
  expect(await loadBoardingDetail('legacy-boarding')).toEqual({ status: 'not-found' });
});

it('detail: maps a backend 404 to not-found', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'Missing' }, 404));
  expect(await loadBoardingDetail('horse-boarding-yandex')).toEqual({ status: 'not-found' });
});

it('detail: keeps other upstream failures as error, distinct from not-found', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'error' }, 503));
  expect(await loadBoardingDetail('horse-boarding-yandex')).toEqual({ status: 'error', statusCode: 503 });
});

it('does not request removed page settings while preserving the price failure', async () => {
  fetcher.mockImplementation(async (url: string) => url.includes('site_settings')
    ? response([{ key: 'services.notice', type: 'string', value: 'Оплата на месте' }])
    : response({ detail: 'Unavailable' }, 503));
  const data = await loadBoardingData();
  expect(data.settings).toEqual({ status: 'empty' });
  expect(fetcher.mock.calls.some(([url]) => String(url).includes('site_settings'))).toBe(false);
  expect(data.prices).toEqual({ status: 'error', statusCode: 503 });
});
