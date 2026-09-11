import { cache } from 'react';
import { z } from 'zod';
import { horseDetail, horseList } from '@/api/horse';
import { validated, listState, type DataState } from '../services/loaders';

export const HORSES_FETCH_LIMIT = 100;
export const HORSES_TIMEOUT_MS = 8000;
const options = () => ({ cache: 'no-store' as const, signal: AbortSignal.timeout(HORSES_TIMEOUT_MS) });

const photo = z.object({ id: z.string().uuid(), is_main: z.boolean(), url: z.string() });
const breedRef = z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional();
const coatColorRef = z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional();
const serviceRef = z.object({ id: z.string().uuid(), name: z.string() });
/**
 * Local schema for the real backend HorseOutDto shape (id/slug/name/pedigree_name/description/
 * breed/coat_color/height/sex/bdate_formatted/age/photos/services/this_stable, per
 * services/backend/src/core/schemas/horses.py and docs/sites/inlove/scheme.md "Наши лошади").
 * `src/types/horse.ts` is intentionally left untouched (still carries the pre-046 `code` field,
 * matching site-ad, which never needed `pedigree_name` since public `name` already substitutes
 * it) — this file defines its own accurate, locally-scoped type instead of editing that contract.
 */
const horseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  pedigree_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  breed: breedRef,
  coat_color: coatColorRef,
  height: z.number().nullable().optional(),
  sex: z.enum(['male', 'female', 'geld']),
  bdate_formatted: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  photos: z.array(photo).optional().default([]),
  services: z.array(serviceRef).optional().default([]),
  this_stable: z.boolean().nullable().optional(),
});
const horsePage = z.object({ total: z.number().int().nonnegative(), items: z.array(horseSchema) });

export type HorseCardDto = z.infer<typeof horseSchema>;

export const loadHorsesList = cache(async (): Promise<DataState<HorseCardDto[]>> => {
  const state = validated<{ items: HorseCardDto[] }>(
    await horseList({ this_stable: true, sort: ['name'], limit: HORSES_FETCH_LIMIT }, options()), horsePage);
  return listState(state);
});

/**
 * D3 privacy guard: `GET /api/horses/{slug_or_id}` does not filter by `this_stable` — it resolves
 * any tenant-matching horse by slug, including private boarding horses. This site MUST reject
 * anything but `this_stable === true` as `not-found`, independent of the backend's 200/404.
 */
export const loadHorseDetail = cache(async (slug: string): Promise<DataState<HorseCardDto> | { status: 'not-found' }> => {
  const state = validated<HorseCardDto>(await horseDetail(slug), horseSchema);
  if (state.status === 'error' && state.statusCode === 404) return { status: 'not-found' };
  if (state.status === 'success' && state.data.this_stable !== true) return { status: 'not-found' };
  return state;
});

export const loadHorsesData = cache(async () => {
  return { horses: await loadHorsesList() };
});

export const SEX_LABELS: Record<HorseCardDto['sex'], string> = { male: 'Жеребец', female: 'Кобыла', geld: 'Мерин' };

/** Russian pluralization for horse age ("1 год" / "2 года" / "5 лет"). */
export function formatAge(age: number | null | undefined): string | undefined {
  if (age === null || age === undefined) return undefined;
  const mod10 = age % 10;
  const mod100 = age % 100;
  const word = mod100 >= 11 && mod100 <= 14 ? 'лет' : mod10 === 1 ? 'год' : mod10 >= 2 && mod10 <= 4 ? 'года' : 'лет';
  return `${age} ${word}`;
}

export function mainPhotoUrl(photos: HorseCardDto['photos']): string | undefined {
  return photos.find((item) => item.is_main)?.url ?? photos[0]?.url;
}
