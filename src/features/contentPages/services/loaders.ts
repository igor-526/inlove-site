import { cache } from 'react';
import { z } from 'zod';
import { newsList, newsDetail } from '@/api/news';
import { siteSettingList } from '@/api/siteSettings';
import type { ApiResult } from '@/types/api';
import type { SiteSettingMiniOutDto } from '@/types/siteSettings';
import type { NewsPublicOutDto, NewsPublicDetailOutDto } from '@/types/news';
import { sanitizeContent } from '@/lib/content/sanitize';
import { SHARED_SETTING_KEYS } from '@/features/siteSettings/services/getSiteSettings';

export type DataState<T> = { status: 'success'; data: T } | { status: 'empty' } |
  { status: 'error'; statusCode?: number };
export const NEWS_PAGE_SIZE = 12;
export const CONTENT_TIMEOUT_MS = 8000;
const options = () => ({ cache: 'no-store' as const, signal: AbortSignal.timeout(CONTENT_TIMEOUT_MS) });
const photo = z.object({ id: z.string().uuid(), is_main: z.boolean(), url: z.string() });
const news = z.object({ id: z.string().uuid(), slug: z.string().min(1), name: z.string().min(1),
  snippet: z.string().nullable(), published_at: z.iso.datetime({ offset: true }), photos: z.array(photo) });
const newsPage = z.object({ total: z.number().int().nonnegative(), items: z.array(news) });
const detail = news.extend({ content: z.string() });
const settingsSchema = z.array(z.object({ key: z.string(), value: z.string(), type: z.string() }));
export function validated<T>(result: ApiResult<unknown>, schema: z.ZodType): DataState<T> {
  if (result.status === 'error') return { status: 'error', statusCode: result.statusCode };
  const parsed = schema.safeParse(result.data);
  return parsed.success ? { status: 'success', data: parsed.data as T } : { status: 'error' };
}
export function listState<T>(state: DataState<{ items: T[] }>): DataState<T[]> {
  if (state.status !== 'success') return state;
  return state.data.items.length ? { status: 'success', data: state.data.items } : { status: 'empty' };
}
export function normalizeNewsPage(value: string | string[] | undefined): { page: number; redirect: boolean } {
  if (value === undefined) return { page: 1, redirect: false };
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    return { page: 1, redirect: true };
  }
  return { page: Number(value), redirect: value === '1' };
}
export const HOME_SETTING_KEYS = ["home.hero_title", "home.hero_subtitle", ...SHARED_SETTING_KEYS] as const;
export const ABOUT_SETTING_KEYS = ["about_1_title", "about_1_text", "about_2_title", "about_2_text", ...SHARED_SETTING_KEYS] as const;
export const loadNewsArchive = cache(async (page = 1): Promise<DataState<{ total: number; items: NewsPublicOutDto[] }> | { status: 'not-found' }> => {
  const state = validated<{ total: number; items: NewsPublicOutDto[] }>(await newsList({ page, limit: NEWS_PAGE_SIZE }, options()), newsPage);
  if (state.status !== 'success') return state;
  if (page > 1 && (page - 1) * NEWS_PAGE_SIZE >= state.data.total) return { status: 'not-found' };
  if (!state.data.items.length && state.data.total > 0) return { status: 'error' };
  return state.data.total === 0 ? { status: 'empty' } : state;
});
export const loadNewsDetail = cache(async (slug: string): Promise<DataState<NewsPublicDetailOutDto> | { status: 'not-found' }> => {
  const state = validated<NewsPublicDetailOutDto>(await newsDetail(slug, options()), detail);
  if (state.status === 'error' && state.statusCode === 404) return { status: 'not-found' };
  if (state.status === 'success') state.data.content = sanitizeContent(state.data.content);
  return state;
});
export const loadHomeData = cache(async () => {
  const [settings, latest] = await Promise.all([
    loadSelectedSettings(HOME_SETTING_KEYS),
    newsList({ page: 1, limit: 1 }, options()),
  ]);
  return { settings,
    news: listState(validated<{ items: NewsPublicOutDto[] }>(latest, newsPage)) };
});
export const loadAboutData = cache(async () => {
  const settings = await loadSelectedSettings(ABOUT_SETTING_KEYS);
  return { settings };
});

async function loadSelectedSettings(keys: readonly string[]): Promise<DataState<SiteSettingMiniOutDto[]>> {
  const state = validated<SiteSettingMiniOutDto[]>(await siteSettingList({ key: [...keys] }, options()), settingsSchema);
  return state.status === 'success' && !state.data.length ? { status: 'empty' } : state;
}
/** Invalid JSON or missing settings remain local fallback decisions of page composition. */
export function settingText(items: SiteSettingMiniOutDto[], key: string): string | undefined {
  const item = items.find((entry) => entry.key === key);
  return item?.type === 'string' && item.value.trim() ? item.value.trim() : undefined;
}
export function settingObject(items: SiteSettingMiniOutDto[], key: string): unknown {
  const item = items.find((entry) => entry.key === key);
  if (item?.type !== 'object') return undefined;
  try { return JSON.parse(item.value); } catch { return undefined; }
}
