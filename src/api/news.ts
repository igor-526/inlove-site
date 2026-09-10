import apiFetch, { addQueryParamsToUrl } from './client';
import type { ApiListPaginatedResponseType } from '@/types/api';
import type { NewsPublicOutDto, NewsPublicDetailOutDto } from '@/types/news';
export const newsList = (params: { page?: number; limit?: number } = {}, options?: RequestInit) =>
  apiFetch<ApiListPaginatedResponseType<NewsPublicOutDto>>(
    addQueryParamsToUrl('/news', { page: params.page ?? 1, limit: params.limit ?? 12 }),
    { ...options, method: 'GET', cache: 'no-store' },
  );
export const newsDetail = (slug: string, options?: RequestInit) =>
  apiFetch<NewsPublicDetailOutDto>(`/news/by-slug/${encodeURIComponent(slug)}`,
    { ...options, method: 'GET', cache: 'no-store' });
