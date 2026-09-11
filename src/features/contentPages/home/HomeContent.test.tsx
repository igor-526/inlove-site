import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { HomeContent, homeMetadata } from './HomeContent';
import type { loadHomeData } from '../services/loaders';
vi.mock('@/api/client', () => ({ default: vi.fn() }));
type Data = Awaited<ReturnType<typeof loadHomeData>>;
const empty: Data = { settings: { status: 'empty' }, news: { status: 'empty' } };
const setting = (key: string, value: string, type = 'string') => ({ key, value, type });
const news = { id: 'news-id', slug: 'club-news', name: 'Встреча в клубе', snippet: 'Новости лошадей', published_at: '2026-09-09T12:00:00Z', photos: [] };
describe('Home SSR', () => {
  it('renders curated ordered sections, one h1, four service cards and one latest slug link', () => {
    const data: Data = { settings: { status: 'success', data: [setting('home.hero_title', 'Заголовок клуба'), setting('home.program_benefits', '[{"title":"Программа"}]', 'object'), setting('home.club_benefits', '[{"title":"Клуб"}]', 'object')] }, news: { status: 'success', data: [news, { ...news, id: 'other', name: 'Лишняя новость' }] } };
    const html = renderToStaticMarkup(<HomeContent data={data} />);
    expect(html.match(/<section\b/g)).toHaveLength(4);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('href="/novosti/club-news"');
    expect(html).toContain('href="/novosti"');
    expect(html).toContain('src="/images/070-home-hero.jpg"');
    for (const icon of ['lessons', 'rides', 'passes', 'boarding']) expect(html).toContain(`/icons/070-${icon}.svg`);
    expect(html.match(/class="[^"]*serviceCard[^"]*"/g)).toHaveLength(4);
    expect(html).not.toContain('Стоимость');
    expect(html).not.toContain('Лишняя новость');
    expect(html).not.toContain('Программа');
  });
  it('keeps fallback hero, service routes, contacts and archive when data is empty', () => {
    const html = renderToStaticMarkup(<HomeContent data={empty} />);
    expect(html).toContain('Конный клуб «Инлав»'); expect(html).toContain('Контакты');
    expect(html).not.toContain('Стоимость'); expect(html).toContain('href="/novosti"');
    expect(html).toContain('href="/uslugi/zanyatiya"'); expect(html).toContain('href="/uslugi/postoy"');
    expect(html).not.toContain('Не удалось'); expect(html).not.toContain('Открыть новость');
  });
  it('distinguishes independent errors including invalid selector from empty data', () => {
    const html = renderToStaticMarkup(<HomeContent data={{ ...empty, news: { status: 'error', statusCode: 401 } }} />);
    expect(html).toContain('Не удалось загрузить новости');
    expect(html).not.toContain('Стоимость уточняется'); expect(html).toContain('Контакты');
  });
  it('handles invalid settings locally and escapes plain CMS text and unsafe links', () => {
    const html = renderToStaticMarkup(<HomeContent data={{ ...empty, settings: { status: 'success', data: [setting('home.hero_title', '<script>alert(1)</script>'), setting('home.program_benefits', '{', 'object'), setting('home.club_benefits', '[null,{"title":2},{"title":"Сохраняется"}]', 'object'), setting('contacts.maps_url', 'javascript:alert(1)'), setting('social.vk_url', 'javascript:alert(1)')] } }} />);
    expect(html).not.toContain('<script>'); expect(html).not.toContain('href="javascript:'); expect(html).not.toContain('Сохраняется');
  });
  it('adapts photo, nullable snippet, encoded slug and tenant date for SSR', () => {
    const html = renderToStaticMarkup(<HomeContent data={{ ...empty,
      settings: { status: 'success', data: [setting('site.timezone', 'Asia/Vladivostok')] },
      news: { status: 'success', data: [{ ...news, slug: 'новость / клуба', snippet: null,
        published_at: '2026-09-09T23:30:00Z', photos: [
          { id: '00000000-0000-0000-0000-000000000001', is_main: false, url: 'https://example.org/first.jpg' },
          { id: '00000000-0000-0000-0000-000000000002', is_main: true, url: 'https://example.org/main.jpg' },
        ] }] },
    }} />);
    expect(html).toContain(`href="/novosti/${encodeURIComponent('новость / клуба')}"`);
    expect(html).toContain('dateTime="2026-09-09T23:30:00Z"');
    expect(html).toContain('10.09.2026');
    expect(html).toContain('https://example.org/main.jpg');
    expect(html).not.toContain('https://example.org/first.jpg');
    expect(html).not.toContain('Новости лошадей');
  });
  it('uses page SEO then default SEO and canonical without browser loading', () => {
    expect(homeMetadata().alternates).toEqual({ canonical: '/' });
    expect(homeMetadata()).toMatchObject({ title: 'Инлав' });
  });
});

describe('Home services regression', () => {
  it('UT-HOME-01 renders the services heading and all four links in SSR HTML', () => {
    const html = renderToStaticMarkup(<HomeContent data={empty} />);
    expect(html).toMatch(/<section[^>]*aria-labelledby="home-services-heading"/);
    expect(html).toMatch(/<h2[^>]*id="home-services-heading"[^>]*>Услуги<\/h2>/);
    expect(html.match(/class="[^"]*serviceCard[^"]*"/g)).toHaveLength(4);
  });

  it('UT-HOME-02 uses responsive content-driven card geometry', () => {
    const css = readFileSync(new URL('./home.module.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/aspect-ratio\s*:\s*1(?:\s|;)/);
    expect(css).toMatch(/\.serviceCard\s*\{[^}]*min-height:\s*var\(--space-40\)[^}]*padding:\s*var\(--space-6\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)[^{]*\{[\s\S]*?\.servicesHeading\s*\{[^}]*margin-bottom:\s*var\(--space-8\)/);
    expect(css).toMatch(/\.serviceCard\s*\{[^}]*min-height:\s*var\(--space-36\)[^}]*padding:\s*var\(--space-4\)/);
  });

  it('UT-HOME-03 preserves service labels, icons and route hrefs', () => {
    const html = renderToStaticMarkup(<HomeContent data={empty} />);
    const services = [
      ['Занятия', '/uslugi/zanyatiya', 'lessons'],
      ['Прогулки', '/uslugi/progulki', 'rides'],
      ['Абонементы', '/uslugi/zanyatiya', 'passes'],
      ['Постой', '/uslugi/postoy', 'boarding'],
    ];
    for (const [label, href, icon] of services) {
      expect(html).toContain(label);
      expect(html).toContain(`href="${href}"`);
      expect(html).toContain(`/icons/070-${icon}.svg`);
    }
    expect(html).toContain('<nav aria-label="Услуги клуба"');
  });
});
