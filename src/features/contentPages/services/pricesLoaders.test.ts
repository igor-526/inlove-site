import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Exercise the real React server cache with a request dispatcher, not a fake memoizer — the
// loaders below are cache()-wrapped and a plain mock would leak state across `it` blocks.
vi.mock('react', async () => {
  const { createRequire } = await import('node:module');
  const { dirname, join } = await import('node:path');
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve('react/package.json')), 'cjs/react.react-server.development.js'));
});
import { createPriceGroupLoaders } from './pricesLoaders';

const fetcher = vi.fn();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const priceItem = (slug: string, groupNames: string[] = []) => ({
  id: '123e4567-e89b-42d3-a456-426614174000', name: `Tariff ${slug}`, slug,
  description: null, photos: [],
  groups: groupNames.map((name, index) => ({ id: `223e4567-e89b-42d3-a456-42661417400${index}`, name })),
  price_tables: [],
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('UT-SC-04: without allowedSlugs, loadList trusts the backend group response one-to-one', async () => {
  fetcher.mockResolvedValueOnce(response({
    total: 3,
    items: [priceItem('a', ['Группа']), priceItem('b', ['Группа']), priceItem('c', ['Группа'])],
  }));
  const { loadList } = createPriceGroupLoaders({ groupsQuery: 'Группа' });
  const state = await loadList();
  expect(state).toEqual({ status: 'success', data: [priceItem('a', ['Группа']), priceItem('b', ['Группа']), priceItem('c', ['Группа'])] });
});

it('with allowedSlugs, loadList still filters the backend response (legacy consumers unaffected)', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 2, items: [priceItem('a'), priceItem('b')] }));
  const { loadList } = createPriceGroupLoaders({ groupsQuery: 'Группа', allowedSlugs: ['a'] });
  expect(await loadList()).toMatchObject({ status: 'success', data: [{ slug: 'a' }] });
});

it('UT-SC-17: with allowedGroups, loadDetail always calls the backend and 404s when groups do not intersect', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('x', ['Другая группа'])));
  const { loadDetail } = createPriceGroupLoaders({ allowedGroups: ['Группа A', 'Группа B'] });
  expect(await loadDetail('x')).toEqual({ status: 'not-found' });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('UT-SC-17: with allowedGroups, loadDetail succeeds when the tariff belongs to any one of them', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('x', ['Группа B'])));
  const { loadDetail } = createPriceGroupLoaders({ allowedGroups: ['Группа A', 'Группа B'] });
  expect(await loadDetail('x')).toMatchObject({ status: 'success', data: { slug: 'x' } });
});

it('legacy allowedSlugs-only guard still short-circuits before calling the backend', async () => {
  const { loadDetail } = createPriceGroupLoaders({ allowedSlugs: ['a'] });
  expect(await loadDetail('outside')).toEqual({ status: 'not-found' });
  expect(fetcher).not.toHaveBeenCalled();
});

it('without allowedSlugs or allowedGroups, loadDetail trusts the backend result entirely', async () => {
  fetcher.mockResolvedValueOnce(response(priceItem('any', [])));
  const { loadDetail } = createPriceGroupLoaders({});
  expect(await loadDetail('any')).toMatchObject({ status: 'success', data: { slug: 'any' } });
});
