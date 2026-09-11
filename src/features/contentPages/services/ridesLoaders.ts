import { cache } from 'react';
import { loadContentSettings } from './loaders';
import { createPriceGroupLoaders } from './pricesLoaders';

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
  const [settings, prices] = await Promise.all([loadContentSettings(), loadRidesList()]);
  return { settings, prices };
});
