import { cache } from 'react';
import { z } from 'zod';
import { horseServiceList } from '@/api/horseServices';
import type { HorseServiceOutDto } from '@/types/horseServices';
import { validated, type DataState } from './loaders';

export const SERVICE_GROUP_BY_ROUTE = {
  zanyatiya: 'Занятия',
  progulki: 'Прогулки',
  postoy: 'Постой',
} as const;

export type ServiceRoute = keyof typeof SERVICE_GROUP_BY_ROUTE;

const service = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  price: z.number(),
  price_formatter: z.enum(['equal', 'gt', 'lt', 'discuss']).optional(),
  page_data: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});
const page = z.object({ total: z.number().int().nonnegative(), items: z.array(service) });
const options = () => ({ cache: 'no-store' as const, signal: AbortSignal.timeout(8000) });

/** Exact name is a stable business identifier. Missing and duplicate matches are both empty,
 * never candidates for fuzzy or first-item fallback. */
export const loadServiceGroup = cache(async (route: ServiceRoute): Promise<DataState<HorseServiceOutDto>> => {
  const exactName = SERVICE_GROUP_BY_ROUTE[route];
  const state = validated<{ items: HorseServiceOutDto[] }>(
    await horseServiceList({ name: exactName, page_data: 'true', limit: 100 }, options()), page);
  if (state.status !== 'success') return state;
  const matches = state.data.items.filter((item) => item.name === exactName);
  return matches.length === 1 ? { status: 'success', data: matches[0] } : { status: 'empty' };
});
