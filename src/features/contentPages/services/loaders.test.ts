import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as React from 'react';
// Exercise the real React server cache with a request dispatcher, not a fake memoizer.
vi.mock('react', async () => {
  const { createRequire } = await import('node:module');
  const { dirname, join } = await import('node:path');
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve('react/package.json')), 'cjs/react.react-server.development.js'));
});
import { loadNewsArchive, loadNewsDetail, loadHomeData, loadAboutData, normalizeNewsPage, CONTENT_TIMEOUT_MS } from './loaders';
const item = { id: '123e4567-e89b-42d3-a456-426614174000', slug: 'news', name: 'News', snippet: null, published_at: '2026-09-01T00:00:00Z', photos: [] };
const fetcher = vi.fn();
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example');
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
it('preserves archive total and distinguishes empty and out of range', async () => {
  fetcher.mockResolvedValueOnce(response({ total: 13, items: [item] }));
  expect(await loadNewsArchive(2)).toEqual({ status: 'success', data: { total: 13, items: [item] } });
  fetcher.mockResolvedValueOnce(response({ total: 0, items: [] })); expect(await loadNewsArchive()).toEqual({ status: 'empty' });
  fetcher.mockResolvedValueOnce(response({ total: 12, items: [] })); expect(await loadNewsArchive(2)).toEqual({ status: 'not-found' });
});
it.each([401, 500, 503])('keeps upstream %s as error', async status => {
  fetcher.mockImplementation(async () => response({ detail: 'error' }, status));
  expect(await loadNewsArchive()).toEqual({ status: 'error', statusCode: status });
  expect(await loadNewsDetail('news')).toEqual({ status: 'error', statusCode: status });
});
it('maps only upstream detail 404 to not-found and validates DTOs', async () => {
  fetcher.mockResolvedValueOnce(response({ detail: 'Missing' }, 404));
  expect(await loadNewsDetail('missing')).toEqual({ status: 'not-found' });
  fetcher.mockResolvedValueOnce(response({ ...item, content: '<p>Safe</p><script>bad</script>' }));
  expect(await loadNewsDetail('news')).toMatchObject({ status: 'success', data: { content: '<p>Safe</p>' } });
  for (const data of [null, {}, { total: 1, items: [{ ...item, slug: null }] }, { total: 1, items: [] }]) {
    fetcher.mockResolvedValueOnce(response(data)); expect(await loadNewsArchive()).toMatchObject({ status: 'error' });
  }
});
it('passes bounded abort signal and treats timeout as error', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  fetcher.mockRejectedValue(new DOMException('Timeout', 'TimeoutError'));
  expect(await loadNewsDetail('news')).toMatchObject({ status: 'error' });
  expect(timeout).toHaveBeenCalledWith(CONTENT_TIMEOUT_MS); timeout.mockRestore();
});
it('home and about keep independent successful settings when entity blocks fail', async () => {
  fetcher.mockImplementation(async (url: string) => url.includes('site_settings') ? response([{ key: 'about.intro', type: 'string', value: 'Intro' }]) : response({ detail: 'Unavailable' }, 503));
  expect(await loadHomeData()).toMatchObject({ settings: { status: 'success' }, news: { status: 'error' } });
  expect(await loadAboutData()).toMatchObject({ settings: { status: 'success' }, photos: { status: 'error' } });
  expect(fetcher.mock.calls.some(([url]) => url.endsWith('/photos?limit=24&sort=created_at'))).toBe(true);
});
it('home uses only anonymous settings/news and never fetches prices', async () => {
  vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'inlove');
  fetcher.mockImplementation(async (url: string) => url.includes('site_settings') ? response([]) : response({ total: 1, items: [item] }));
  expect(await loadHomeData()).toEqual({ settings: { status: 'empty' }, news: { status: 'success', data: [item] } });
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const [url, options] of fetcher.mock.calls) {
    expect(url).not.toContain('prices');
    expect(options.headers.get('Authorization')).toBeNull();
    expect(options.headers.get('Cookie')).toBeNull();
    expect(options.headers.get('X-Equestrian-Service-Key')).toBe('inlove');
  }
});
it.each(['0', '-1', '1.2', '01', '', 'abc', ['2'], '9007199254740992'])('normalizes invalid page %s', input => {
  expect(normalizeNewsPage(input)).toEqual({ page: 1, redirect: true });
});
it('normalizes canonical first page and valid subsequent page', () => {
  expect(normalizeNewsPage(undefined)).toEqual({ page: 1, redirect: false });
  expect(normalizeNewsPage('1')).toEqual({ page: 1, redirect: true });
  expect(normalizeNewsPage('2')).toEqual({ page: 2, redirect: false });
});

it('shares metadata/content result within a request and isolates the next tenant request', async () => {
  const internals = (React as unknown as Record<string, { A: unknown }>).__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const startRequest = () => {
    const values = new Map<unknown, unknown>();
    internals.A = { getCacheForType(factory: () => unknown) {
      if (!values.has(factory)) values.set(factory, factory());
      return values.get(factory);
    } };
  };
  fetcher.mockImplementation(async () => response({ ...item, content: '<p>First</p>' }));
  try {
    startRequest();
    const metadata = loadNewsDetail('news'); const body = loadNewsDetail('news');
    expect(metadata).toBe(body); await metadata; expect(fetcher).toHaveBeenCalledTimes(1);
    vi.stubEnv('NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY', 'another-tenant');
    startRequest();
    fetcher.mockImplementation(async () => response({ detail: 'Missing' }, 404));
    expect(await loadNewsDetail('news')).toEqual({ status: 'not-found' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1].headers.get('X-Equestrian-Service-Key')).toBe('another-tenant');
  } finally { internals.A = null; }
});
