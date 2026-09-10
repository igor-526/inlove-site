import type { PhotoOutShortDto } from './photos';
export type NewsPublicOutDto = {
  id: string; slug: string; name: string; snippet: string | null;
  published_at: string; photos: PhotoOutShortDto[];
};
export type NewsPublicDetailOutDto = NewsPublicOutDto & { content: string };
