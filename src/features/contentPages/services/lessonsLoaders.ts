import { cache } from 'react';
import { loadContentSettings } from './loaders';
import { createPriceGroupLoaders } from './pricesLoaders';

export const LESSONS_GROUP_NAME = 'Основные услуги';

/** Single source of truth for the /uslugi/zanyatiya allow-list: used by both the list loader
 * and the [slug] detail guard, per design D2 (scheme.md "Интеграция с CMS"). */
export const LESSONS_ALLOWED_SLUGS = [
  'individual-lesson-official',
  'group-lesson-official',
  'training-package-8-official',
  'individual-membership-official',
  'subscription-4-yandex',
  'riding-training-yandex',
  'subscription-8-yandex',
  'individual-subscription-8-yandex',
] as const;

export type LessonCategory = 'single' | 'subscription';
/** Local "Разовые / Абонементы" categorization for the client-side switcher (display grouping
 * only; it never affects the allow-list guard above). */
export const LESSON_CATEGORY: Record<string, LessonCategory> = {
  'individual-lesson-official': 'single',
  'group-lesson-official': 'single',
  'riding-training-yandex': 'single',
  'training-package-8-official': 'subscription',
  'individual-membership-official': 'subscription',
  'subscription-4-yandex': 'subscription',
  'subscription-8-yandex': 'subscription',
  'individual-subscription-8-yandex': 'subscription',
};

const { loadList, loadDetail } = createPriceGroupLoaders({
  groupsQuery: LESSONS_GROUP_NAME,
  allowedSlugs: LESSONS_ALLOWED_SLUGS,
});
export const loadLessonsList = loadList;
export const loadLessonsDetail = loadDetail;

export const loadLessonsData = cache(async () => {
  const [settings, prices] = await Promise.all([loadContentSettings(), loadLessonsList()]);
  return { settings, prices };
});
