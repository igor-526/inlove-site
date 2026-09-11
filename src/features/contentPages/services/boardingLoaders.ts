import { cache } from 'react';
import { loadContentSettings } from './loaders';
import { createPriceGroupLoaders } from './pricesLoaders';

/** scheme.md "Услуги / Постой": `GET /api/prices?name=Постой частных лошадей`. */
export const BOARDING_NAME_QUERY: string[] = ['Постой частных лошадей'];

/** Single source of truth for the /uslugi/postoy allow-list: used by both the list loader
 * and the [slug] detail guard, per design D2. Only one tariff — no toggle/conflicting-cards
 * pattern needed here (unlike zanyatiya/progulki). */
export const BOARDING_ALLOWED_SLUGS = ['horse-boarding-yandex'] as const;

const { loadList, loadDetail } = createPriceGroupLoaders({
  nameQuery: BOARDING_NAME_QUERY,
  allowedSlugs: BOARDING_ALLOWED_SLUGS,
});
export const loadBoardingList = loadList;
export const loadBoardingDetail = loadDetail;

export const loadBoardingData = cache(async () => {
  const [settings, prices] = await Promise.all([loadContentSettings(), loadBoardingList()]);
  return { settings, prices };
});
