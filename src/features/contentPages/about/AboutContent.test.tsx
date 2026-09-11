import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AboutContent } from './AboutContent';
import type { SiteSettingMiniOutDto } from '@/types/siteSettings';

const setting = (key: string, value: unknown): SiteSettingMiniOutDto => ({ key, type: typeof value === 'string' ? 'string' : 'object', value: typeof value === 'string' ? value : JSON.stringify(value) });
const render = (settings: SiteSettingMiniOutDto[] = []) => renderToStaticMarkup(<AboutContent data={{ settings: { status: 'success', data: settings } }} />);

describe('curated about SSR', () => {
  it('renders two complete flat pairs in order and one h1', () => {
    const html = render([setting('about_1_title', 'Первый'), setting('about_1_text', 'Текст один'), setting('about_2_title', 'Второй'), setting('about_2_text', 'Текст два')]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const value of ['Первый', 'Текст один', 'Второй', 'Текст два', 'Контакты']) expect(html).toContain(value);
    expect(html.indexOf('Первый')).toBeLessThan(html.indexOf('Второй'));
  });

  it('hides each incomplete pair without affecting contacts', () => {
    const html = render([setting('about_1_title', 'Без текста'), setting('about_2_text', 'Без заголовка')]);
    expect(html).not.toContain('Без текста'); expect(html).not.toContain('Без заголовка');
    expect(html).toContain('О клубе'); expect(html).toContain('Контакты');
  });

  it('ignores every legacy about, gallery, team, reviews and duplicate-address key', () => {
    const legacy = ['about.intro', 'about.setting', 'about.features', 'about.gallery_photo_ids', 'team.people', 'reviews.summary', 'contacts.address_alternative'];
    const html = render(legacy.map((key) => setting(key, `legacy-${key}`)));
    for (const key of legacy) expect(html).not.toContain(`legacy-${key}`);
    expect(html).not.toContain('about-gallery'); expect(html).not.toContain('about-team'); expect(html).not.toContain('about-reviews');
  });

  it('renders atomic contacts independently with safe links', () => {
    const html = render([setting('contacts.address', 'Основной адрес'), setting('contacts.nearest_stop', 'Остановка Лесная'), setting('contacts.primary_phone', '+79219880772'), setting('contacts.maps_url', 'https://yandex.ru/maps/'), setting('social.vk_url', 'https://vk.com/inlove')]);
    for (const value of ['Основной адрес', 'Остановка Лесная', '+7 921 988-07-72']) expect(html).toContain(value);
    expect(html).toContain('target="_blank"'); expect(html).toContain('rel="noopener noreferrer"');
  });
});
