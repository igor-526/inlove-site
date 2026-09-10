import { afterEach, expect, it, vi } from 'vitest';
import { newsList, newsDetail } from './news';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('uses exact page/limit and encoded slug with anonymous selector and no-store', async () => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'tenant');
  const fetcher = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetcher);
  await newsList({ page: 2, limit: 12 }, { headers: { Authorization: 'secret', Cookie: 'secret' }, cache: 'force-cache' });
  expect(fetcher.mock.calls[0][0]).toBe('https://api.example/api/news?page=2&limit=12');
  const init = fetcher.mock.calls[0][1];
  expect(init.credentials).toBe('omit'); expect(init.cache).toBe('no-store');
  expect(init.headers.get('X-Equestrian-Service-Key')).toBe('tenant');
  expect(init.headers.has('Authorization')).toBe(false); expect(init.headers.has('Cookie')).toBe(false);
  await newsDetail('новость/a?b');
  expect(fetcher.mock.calls[1][0]).toBe('https://api.example/api/news/by-slug/' + encodeURIComponent('новость/a?b'));
});
