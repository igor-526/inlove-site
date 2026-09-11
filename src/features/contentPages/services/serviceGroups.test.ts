import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
vi.mock('react', async () => {
  const { createRequire } = await import('node:module');
  const { dirname, join } = await import('node:path');
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve('react/package.json')), 'cjs/react.react-server.development.js'));
});
import { loadServiceGroup, SERVICE_GROUP_BY_ROUTE } from './serviceGroups';

const fetcher = vi.fn();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const service = (name: string, slug = 'service') => ({
  id: '123e4567-e89b-42d3-a456-426614174000', name, slug, description: `${name} description`,
  price: 0, price_formatter: 'discuss', created_at: '2026-09-11T00:00:00Z', updated_at: null,
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each(Object.entries(SERVICE_GROUP_BY_ROUTE))('loads %s only by exact group name', async (route, name) => {
  fetcher.mockResolvedValueOnce(response({ total: 2, items: [service(name), service(`${name} для детей`, 'other')] }));
  expect(await loadServiceGroup(route as keyof typeof SERVICE_GROUP_BY_ROUTE)).toMatchObject({ status: 'success', data: { name } });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toContain(`name=${encodeURIComponent(name).replace(/%20/g, '+')}`);
  expect(options.headers.get('X-Equestrian-Service-Key')).toBe('inlove');
  expect(options.headers.get('Authorization')).toBeNull();
});

it('does not fuzzy-match a renamed group', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 1, items: [service('Занятия для всех')] }));
  expect(await loadServiceGroup('zanyatiya')).toEqual({ status: 'empty' });
});

it('rejects duplicate exact groups as an ambiguous empty state', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 2, items: [service('Постой', 'one'), service('Постой', 'two')] }));
  expect(await loadServiceGroup('postoy')).toEqual({ status: 'empty' });
});

it.each([401, 500, 503])('preserves tenant/API failure %s', async (status) => {
  fetcher.mockResolvedValueOnce(response({ detail: 'error' }, status));
  expect(await loadServiceGroup('progulki')).toEqual({ status: 'error', statusCode: status });
});

it('service pages contain no removed settings consumers', () => {
  const root = resolve(process.cwd(), 'src/features/contentPages');
  const source = ['lessons/LessonsContent.tsx', 'rides/RidesContent.tsx', 'boarding/BoardingContent.tsx']
    .map((file) => readFileSync(resolve(root, file), 'utf8')).join('\n');
  for (const key of ['services.notice', 'home.program_benefits', 'about.setting', 'about.features', 'seo.lessons', 'seo.rides', 'seo.boarding', 'site.short_name']) {
    expect(source).not.toContain(key);
  }
  for (const canonical of ['/uslugi/zanyatiya', '/uslugi/progulki', '/uslugi/postoy']) expect(source).toContain(canonical);
});
