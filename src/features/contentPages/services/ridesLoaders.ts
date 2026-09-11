import { cache } from 'react';
import { createPriceGroupLoaders } from './pricesLoaders';
import { loadServiceGroup } from './serviceGroups';
import type { DataState } from './loaders';

/** scheme.md "Услуги / Прогулки": `GET /api/prices?name=Конные прогулки&name=Конная прогулка`. */
export const RIDES_NAME_QUERY: string[] = ['Конные прогулки', 'Конная прогулка'];

/** Single source of truth for the /uslugi/progulki allow-list: used by both the list loader
 * and the [slug] detail guard, per design D2. Two conflicting offers, shown separately. */
export const RIDES_ALLOWED_SLUGS = ['horse-rides-official', 'horse-ride-yandex'] as const;

const { loadList, loadDetail } = createPriceGroupLoaders({
  nameQuery: RIDES_NAME_QUERY,
  allowedSlugs: RIDES_ALLOWED_SLUGS,
});
export const loadRidesList = loadList;
export const loadRidesDetail = loadDetail;

export const loadRidesData = cache(async () => {
  const [group, prices] = await Promise.all([loadServiceGroup('progulki'), loadRidesList()]);
  return { group, prices, settings: { status: 'empty' } as DataState<{ key: string; value: string; type: string }[]> };
});
