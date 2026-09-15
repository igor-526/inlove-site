import { cache } from 'react';
import { z } from 'zod';
import { priceDetail, priceList } from '@/api/price';
import type { PriceListQueryParams, PriceOutWithTablesDto } from '@/types/prices';
import { validated, type DataState } from './loaders';

export const PRICE_FETCH_LIMIT = 100;
export const PRICE_TIMEOUT_MS = 8000;
const options = () => ({ cache: 'no-store' as const, signal: AbortSignal.timeout(PRICE_TIMEOUT_MS) });

const cellFormatter = z.enum(['text_bold', 'text_italic', 'text_underline']);
const tableCell = z.object({ value: z.string(), annotation: z.string(), cell_formatter: z.array(cellFormatter) });
const tableColumn = z.object({ key: z.string(), title: z.string(), annotation: z.string(), cell_formatter: z.array(cellFormatter) });
const tableRow = z.object({ cells: z.record(z.string(), tableCell) });
const priceTable = z.object({ columns: z.array(tableColumn), rows: z.array(tableRow) });
const photo = z.object({ id: z.string().uuid(), is_main: z.boolean(), url: z.string() });
const priceGroup = z.object({ id: z.string().uuid(), name: z.string() });
const price = z.object({
  id: z.string().uuid(), name: z.string().min(1), slug: z.string().min(1),
  description: z.string().nullable(), photos: z.array(photo),
  groups: z.array(priceGroup), price_tables: z.array(priceTable),
});
const pricePage = z.object({ total: z.number().int().nonnegative(), items: z.array(price) });

export type PriceGroupConfig = {
  groupsQuery?: PriceListQueryParams['groups'];
  /** Repeatable `name` filter (e.g. `?name=A&name=B`), for page groups keyed by price name
   * instead of a shared price_groups entry — legacy path predating D5's dedicated
   * price_groups per page; kept only for consumers not yet migrated to `groupsQuery`. */
  nameQuery?: PriceListQueryParams['name'];
  /** Legacy client-side slug allow-list applied on top of the backend response. Optional
   * (D5/FE-4.1): a page fully migrated to its own dedicated `price_groups` entry omits it and
   * trusts the backend group response as-is, without any client-side filtering. When present,
   * it also gates `loadDetail` by slug and skips the backend call entirely for a slug outside
   * the list (legacy short-circuit, unchanged for existing consumers). */
  allowedSlugs?: readonly string[];
  /** Page-level set of `price_groups` names allowed on this page's detail route (D5). When
   * present, `loadDetail` always calls the backend for the slug and returns `not-found` unless
   * the returned tariff's own `groups` field intersects this set — a backend-trust guard that
   * replaces the `allowedSlugs`-based detail guard for pages migrated to dedicated groups. */
  allowedGroups?: readonly string[];
};

/**
 * Shared list+detail loader factory for a services page group. SC-2 (progulki) and SC-3
 * (postoy) reuse this factory with their own group/name/allow-list instead of copying the
 * fetch/validation logic; pages migrated to D5's dedicated `price_groups` (e.g. zanyatiya)
 * instead pass `groupsQuery`/`allowedGroups` and no client-side slug filtering at all.
 */
export function createPriceGroupLoaders({ groupsQuery, nameQuery, allowedSlugs, allowedGroups }: PriceGroupConfig) {
  const loadList = cache(async (): Promise<DataState<PriceOutWithTablesDto[]>> => {
    const state = validated<{ items: PriceOutWithTablesDto[] }>(
      await priceList({ groups: groupsQuery, name: nameQuery, limit: PRICE_FETCH_LIMIT }, options()), pricePage);
    if (state.status !== 'success') return state;
    const items = allowedSlugs ? state.data.items.filter((item) => allowedSlugs.includes(item.slug)) : state.data.items;
    return items.length ? { status: 'success', data: items } : { status: 'empty' };
  });
  const loadDetail = cache(async (slug: string): Promise<DataState<PriceOutWithTablesDto> | { status: 'not-found' }> => {
    // Legacy allow-list guard: 404 before ever calling the backend for a slug this page never
    // owns. Only applies when there is no allowedGroups guard (D5 supersedes it below).
    if (!allowedGroups && allowedSlugs && !allowedSlugs.includes(slug)) return { status: 'not-found' };
    const state = validated<PriceOutWithTablesDto>(await priceDetail(slug), price);
    if (state.status === 'error' && state.statusCode === 404) return { status: 'not-found' };
    // Backend-trust guard (D5): always ask the backend, then 404 a tariff whose own `groups`
    // don't intersect this page's allowed groups — it belongs to another page (or another
    // tenant/catch-all group), regardless of what the backend itself would resolve.
    if (allowedGroups && state.status === 'success') {
      const names = new Set(state.data.groups.map((group) => group.name));
      if (!allowedGroups.some((name) => names.has(name))) return { status: 'not-found' };
    }
    return state;
  });
  return { loadList, loadDetail };
}
