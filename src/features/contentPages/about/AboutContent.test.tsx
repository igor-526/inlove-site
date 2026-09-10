import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AboutContent } from './AboutContent';
import type { SiteSettingMiniOutDto } from '@/types/siteSettings';
import type { PhotoOutDto } from '@/types/photos';

const setting = (key: string, value: unknown): SiteSettingMiniOutDto => ({ key, type: typeof value === 'string' ? 'string' : 'object', value: typeof value === 'string' ? value : JSON.stringify(value) });
const photo = (id: string): PhotoOutDto => ({ id: id as PhotoOutDto["id"], url: `https://example.com/${id}.jpg`, name: id, description: `Фото ${id}`, path: id, created_at: '', updated_at: null });
const render = (settings: SiteSettingMiniOutDto[] = [], photos: PhotoOutDto[] = []) => renderToStaticMarkup(<AboutContent data={{ settings: { status: 'success', data: settings }, photos: { status: 'success', data: photos } }} />);

describe('about SSR without hydration', () => {
  it('keeps one heading, contacts without removed sections on empty data', () => {
    const html = render();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('Контакты');
    expect(html).not.toContain('id="privacy"');
    expect(html).not.toContain('Способы оплаты');
    expect(html).not.toContain('id="about-team"');
    expect(html).not.toContain('id="about-reviews"');
  });
  it('isolates invalid JSON and photo errors', () => {
    const html = renderToStaticMarkup(<AboutContent data={{ settings: { status: 'success', data: [setting('about.intro', 'Описание клуба'), { key: 'team.people', type: 'object', value: '{invalid' }] }, photos: { status: 'error' } }} />);
    expect(html).toContain('Описание клуба');
    expect(html).toContain('Фотографии временно недоступны');
    expect(html).not.toContain('id="privacy"');
  });
  it('renders updated CMS intro, setting and feature text in server HTML', () => {
    const html = render([setting('about.intro', 'Редакционное вступление из CMS'), setting('about.setting', 'Окружение из CMS'), setting('about.features', [{ id: 'f1', label: 'Особенность из CMS', value: 'Описание из CMS', approved: true }])]);
    for (const text of ['Редакционное вступление из CMS', 'Окружение из CMS', 'Особенность из CMS', 'Описание из CMS']) expect(html).toContain(text);
    expect(html).not.toContain('/about#privacy');
  });
  it('publishes only explicitly approved people and infrastructure', () => {
    const html = render([setting('team.people', [{ name: 'Одобрена', approved: true }, { name: 'Подтверждён', status: 'approved' }, { name: 'Непроверена', status: 'reported' }, { name: 'Некорректна', approved: 'true' }]), setting('about.features', [{ label: 'Проверенное поле', value: true, approved: true }, { label: 'Спорный пандус', value: true }])]);
    expect(html).toContain('Одобрена'); expect(html).toContain('Подтверждён');
    expect(html).not.toContain('Непроверена'); expect(html).not.toContain('Некорректна');
    expect(html).toContain('Проверенное поле'); expect(html).not.toContain('Спорный пандус');
  });
  it('intersects gallery selection with available photos in editorial order', () => {
    const html = render([setting('about.gallery_photo_ids', ['b', 'missing', 'a', 'b'])], [photo('a'), photo('b'), photo('c')]);
    expect(html).toContain('Фото b'); expect(html).toContain('Фото a'); expect(html).not.toContain('Фото c');
    expect(html.indexOf('alt="Фото b"')).toBeLessThan(html.indexOf('alt="Фото a"'));
    expect(render([setting('about.gallery_photo_ids', [])], [photo('a')])).not.toContain('id="about-gallery"');
    expect(render([], [photo('a')])).toContain('Фото a');
  });
  it('omits obsolete legal content and unsafe contact URLs', () => {
    const html = render([setting('legal.privacy_policy_text', '<p>Безопасный текст</p><script>alert(1)</script>'), setting('contacts.maps_url', 'javascript:alert(1)'), setting('social.vk_url', 'javascript:alert(2)')]);
    expect(html).not.toContain('Безопасный текст'); expect(html).not.toContain('alert('); expect(html).not.toContain('id="privacy"');
  });
  it('renders CMS setting text and review aggregates without payment', () => {
    const html = render([setting('reviews.summary', { rating: 4.9, rating_count: 38, review_count: 31, strengths: ['Атмосфера'], collected_at: '2026-09-08', reviews: ['Чужой текст отзыва'] }), setting('about.payment_methods', ['СБП', 'наличные']), setting('about.setting', 'Лес рядом')]);
    expect(html).toContain('31 отзывов'); expect(html).not.toContain('СБП'); expect(html).toContain('Лес рядом'); expect(html).not.toContain('Чужой текст отзыва');
  });
});
