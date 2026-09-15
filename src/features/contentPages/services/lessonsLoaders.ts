import { cache } from 'react';
import type { PriceOutWithTablesDto } from '@/types/prices';
import { createPriceGroupLoaders } from './pricesLoaders';
import { loadServiceGroup } from './serviceGroups';
import type { DataState } from './loaders';

export type LessonCategory = 'single' | 'subscription';

/** D5: "one services page = one dedicated price_groups group". The "Разовые/Абонементы"
 * toggle queries these two groups as two independent `GET /api/prices?groups=<name>` requests
 * (never a repeatable `groups=` param) — this is the single source of truth for both the group
 * query values and the category each rendered tariff belongs to (via its own `groups` field),
 * replacing the old static `LESSON_CATEGORY` slug dictionary layered over the shared
 * "Основные услуги" catch-all group. */
export const LESSONS_GROUPS: Record<LessonCategory, string> = {
  single: 'Разовые',
  subscription: 'Абонементы',
};

const singleLoaders = createPriceGroupLoaders({ groupsQuery: LESSONS_GROUPS.single });
const subscriptionLoaders = createPriceGroupLoaders({ groupsQuery: LESSONS_GROUPS.subscription });
/** Detail route (`/uslugi/zanyatiya/[slug]`) is shared by both toggle states: gate it by
 * membership in *either* group via the tariff's own `groups` field (D5 backend-trust guard),
 * not a static slug allow-list. */
const { loadDetail } = createPriceGroupLoaders({ allowedGroups: Object.values(LESSONS_GROUPS) });

export const loadLessonsSingleList = singleLoaders.loadList;
export const loadLessonsSubscriptionList = subscriptionLoaders.loadList;
export const loadLessonsDetail = loadDetail;

/** Merges the two independent group responses into one list state: a page-level failure is
 * only surfaced when neither group produced any items, so one group being empty/erroring
 * doesn't blank out a category that did load successfully (LessonsPrices renders the
 * per-category empty/error fallback for whichever toggle state has no items). */
function mergeGroupLists(...states: DataState<PriceOutWithTablesDto[]>[]): DataState<PriceOutWithTablesDto[]> {
  const items = states.flatMap((state) => (state.status === 'success' ? state.data : []));
  if (items.length) return { status: 'success', data: items };
  const errored = states.find((state) => state.status === 'error');
  return errored ?? { status: 'empty' };
}

export const loadLessonsData = cache(async () => {
  const [group, single, subscription] = await Promise.all([
    loadServiceGroup('zanyatiya'),
    loadLessonsSingleList(),
    loadLessonsSubscriptionList(),
  ]);
  return {
    group,
    prices: mergeGroupLists(single, subscription),
    settings: { status: 'empty' } as DataState<{ key: string; value: string; type: string }[]>,
  };
});
