import { cache } from 'react';
import { createPriceGroupLoaders } from './pricesLoaders';
import { loadServiceGroup } from './serviceGroups';
import type { DataState } from './loaders';

/** D5: "one services page = one dedicated price_groups group" (OQ4 extended scope).
 * `/uslugi/progulki` queries the dedicated "Прогулки" group directly — no more repeatable
 * `?name=Конные+прогулки&name=Конная+прогулка` filter and no client-side slug allow-list. The
 * detail route (`/uslugi/progulki/[slug]`) is gated by this same group name via the tariff's
 * own `groups` field (D5 backend-trust guard), replacing the old `RIDES_ALLOWED_SLUGS` array. */
export const RIDES_GROUP = 'Прогулки';

const { loadList, loadDetail } = createPriceGroupLoaders({
  groupsQuery: RIDES_GROUP,
  allowedGroups: [RIDES_GROUP],
});
export const loadRidesList = loadList;
export const loadRidesDetail = loadDetail;

export const loadRidesData = cache(async () => {
  const [group, prices] = await Promise.all([loadServiceGroup('progulki'), loadRidesList()]);
  return { group, prices, settings: { status: 'empty' } as DataState<{ key: string; value: string; type: string }[]> };
});
