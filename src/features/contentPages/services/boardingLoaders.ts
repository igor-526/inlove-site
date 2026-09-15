import { cache } from 'react';
import { createPriceGroupLoaders } from './pricesLoaders';
import { loadServiceGroup } from './serviceGroups';
import type { DataState } from './loaders';

/** D5: "one services page = one dedicated price_groups group" (OQ4 extended scope).
 * `/uslugi/postoy` queries the dedicated "Постой частных лошадей" group directly — no more
 * `?name=Постой+частных+лошадей` filter and no client-side slug allow-list. The detail route
 * (`/uslugi/postoy/[slug]`) is gated by this same group name via the tariff's own `groups`
 * field (D5 backend-trust guard), replacing the old `BOARDING_ALLOWED_SLUGS` array. */
export const BOARDING_GROUP = 'Постой частных лошадей';

const { loadList, loadDetail } = createPriceGroupLoaders({
  groupsQuery: BOARDING_GROUP,
  allowedGroups: [BOARDING_GROUP],
});
export const loadBoardingList = loadList;
export const loadBoardingDetail = loadDetail;

export const loadBoardingData = cache(async () => {
  const [group, prices] = await Promise.all([loadServiceGroup('postoy'), loadBoardingList()]);
  return { group, prices, settings: { status: 'empty' } as DataState<{ key: string; value: string; type: string }[]> };
});
