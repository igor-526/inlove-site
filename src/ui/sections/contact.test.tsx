// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeContent } from '@/features/contentPages/home/HomeContent';
import { AboutContent } from '@/features/contentPages/about/AboutContent';
import { CALLBACK_REQUEST_EVENT } from '@/features/siteChrome/SiteChrome';
import type { SiteSettingMiniOutDto } from '@/types/siteSettings';
import { MapEmbed } from '../media';
import { parseCoordinates } from '../media/coordinates';
import { ContactSection } from './index';

const setting = (key: string, value: unknown, type?: string): SiteSettingMiniOutDto => ({ key, type: type ?? (typeof value === 'string' ? 'string' : 'object'), value: typeof value === 'string' ? value : JSON.stringify(value) });
const settings = { status: 'success' as const, data: [
  setting('contacts.primary_phone', '+79219880772'), setting('social.vk_url', 'https://vk.ru/inlovehorse'),
  setting('social.instagram_url', 'https://www.instagram.com/ksk.inlove/'),
  setting('contacts.map.latitude', '59.773315', 'float'),
  setting('contacts.map.longitude', '29.973801', 'float'),
  setting('contacts.map.url', 'https://yandex.ru/maps/org/inlav/65789410136/'),
] };
afterEach(cleanup);
describe('NOTE-02 shared contacts', () => {
  for (const page of ['home', 'about']) {
    const content = () => page === 'home' ? <HomeContent data={{ settings, news: { status: 'empty' } }} /> : <AboutContent data={{ settings }} />;
    it(`${page}: renders three icon rows, independent widget and secure links in SSR`, () => {
      const document = new DOMParser().parseFromString(renderToStaticMarkup(content()), 'text/html');
      const contacts = document.querySelector('[aria-labelledby="contacts-heading"]')!;
      expect(contacts).toBeTruthy();
      expect(contacts.querySelectorAll('li')).toHaveLength(3);
      expect(contacts.querySelectorAll('li svg[aria-hidden="true"]')).toHaveLength(3);
      expect(contacts.textContent).toContain('+7 921 988-07-72');
      expect(contacts.textContent).toContain('VK');
      expect(contacts.textContent).not.toContain('ВКонтакте');
      for (const link of contacts.querySelectorAll('a')) {
        expect(link.target).toBe('_blank'); expect(link.rel).toBe('noopener noreferrer');
      }
      const widget = new URL(contacts.querySelector('iframe')!.src);
      expect(widget.pathname).toBe('/map-widget/v1/');
      expect(widget.searchParams.get('ll')).toBe('29.973801,59.773315');
      expect(widget.searchParams.get('pt')).toContain('29.973801,59.773315');
      expect(contacts.querySelector('figcaption a')?.getAttribute('href')).toBe('https://yandex.ru/maps/org/inlav/65789410136/');
    });
    it(`${page}: preserves callback route context`, () => {
      const listener = vi.fn(); window.addEventListener(CALLBACK_REQUEST_EVENT, listener);
      const { container } = render(content());
      const contacts = container.querySelector('[aria-labelledby="contacts-heading"]')!;
      fireEvent.click(within(contacts as HTMLElement).getByRole('button', { name: 'Обратный звонок' }));
      expect((listener.mock.calls[0][0] as CustomEvent).detail).toMatchObject(page === 'home' ? { route: 'Главная' } : { route: '/about', serviceName: 'О клубе' });
      window.removeEventListener(CALLBACK_REQUEST_EVENT, listener);
    });
  }
  it('hides the map card when only one coordinate is set and there is no map url', () => {
    const { container, queryByText } = render(<ContactSection address="Адрес" socialLinks={[]} ctaLabel="Связаться" context="Тест" onRequest={vi.fn()} latitude={59.773315} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(queryByText('Карта недоступна')).toBeNull();
  });
  it('rejects invalid coordinates and keeps external route with missing embed', () => {
    for (const [lat, lng] of [[91, 1], [0, Infinity], [Number.NaN, 29], [undefined, undefined]] as const) expect(parseCoordinates(lat, lng)).toBeUndefined();
    expect(parseCoordinates(0, 0)).toEqual({ lat: 0, lng: 0 });
    const { container, getByRole } = render(<MapEmbed address="Адрес клуба" mapUrl="https://yandex.ru/maps/" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByRole('link', { name: 'Открыть маршрут' }).getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('renders separate weekday and weekend hours when both pairs are complete', () => {
    const { getByText } = render(<ContactSection address="Адрес" socialLinks={[]} ctaLabel="Связаться" context="Тест" onRequest={vi.fn()}
      weekdayHours={{ start: '10:00', stop: '21:00' }} weekendHours={{ start: '11:00', stop: '20:00' }} />);
    expect(getByText('Будни: 10:00–21:00')).toBeTruthy();
    expect(getByText('Выходные: 11:00–20:00')).toBeTruthy();
  });
  it('hides an incomplete hours pair independently without inventing a value', () => {
    const { getByText, queryByText } = render(<ContactSection address="Адрес" socialLinks={[]} ctaLabel="Связаться" context="Тест" onRequest={vi.fn()}
      weekdayHours={{ start: '10:00', stop: '' }} weekendHours={{ start: '11:00', stop: '20:00' }} />);
    expect(queryByText(/Будни/)).toBeNull();
    expect(getByText('Выходные: 11:00–20:00')).toBeTruthy();
  });
  it('renders nothing for hours when both pairs are absent', () => {
    const { queryByText } = render(<ContactSection address="Адрес" socialLinks={[]} ctaLabel="Связаться" context="Тест" onRequest={vi.fn()} />);
    expect(queryByText(/Будни/)).toBeNull();
    expect(queryByText(/Выходные/)).toBeNull();
  });
});
