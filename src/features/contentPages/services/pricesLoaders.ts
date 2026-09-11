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
   * instead of a shared price_groups entry — SC-2 (progulki: "Конные прогулки"/"Конная прогулка"). */
  nameQuery?: PriceListQueryParams['name'];
  allowedSlugs: readonly string[];
};

/**
 * Shared list+detail loader factory for a services page group (allow-list of price slugs).
 * SC-2 (progulki) and SC-3 (postoy) reuse this factory with their own group/name/allow-list
 * instead of copying the fetch/validation/allow-list logic.
 */
export function createPriceGroupLoaders({ groupsQuery, nameQuery, allowedSlugs }: PriceGroupConfig) {
  const loadList = cache(async (): Promise<DataState<PriceOutWithTablesDto[]>> => {
    const state = validated<{ items: PriceOutWithTablesDto[] }>(
      await priceList({ groups: groupsQuery, name: nameQuery, limit: PRICE_FETCH_LIMIT }, options()), pricePage);
    if (state.status !== 'success') return state;
    const items = state.data.items.filter((item) => allowedSlugs.includes(item.slug));
    return items.length ? { status: 'success', data: items } : { status: 'empty' };
  });
  const loadDetail = cache(async (slug: string): Promise<DataState<PriceOutWithTablesDto> | { status: 'not-found' }> => {
    // Allow-list guard first: a slug outside this page's group must 404 even if the backend
    // would resolve it (another page's tariff, or any other tenant price), per D2.
    if (!allowedSlugs.includes(slug)) return { status: 'not-found' };
    const state = validated<PriceOutWithTablesDto>(await priceDetail(slug), price);
    if (state.status === 'error' && state.statusCode === 404) return { status: 'not-found' };
    return state;
  });
  return { loadList, loadDetail };
}
