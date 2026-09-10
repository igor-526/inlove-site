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

const setting = (key: string, value: unknown): SiteSettingMiniOutDto => ({ key, type: typeof value === 'string' ? 'string' : 'object', value: typeof value === 'string' ? value : JSON.stringify(value) });
const settings = { status: 'success' as const, data: [
  setting('contacts.primary_phone', '+79219880772'), setting('social.vk_url', 'https://vk.ru/inlovehorse'),
  setting('social.instagram_url', 'https://www.instagram.com/ksk.inlove/'),
  setting('contacts.coordinates', { latitude: 59.773315, longitude: 29.973801 }),
  setting('contacts.maps_url', 'https://yandex.ru/maps/org/inlav/65789410136/'),
] };
afterEach(cleanup);
describe('NOTE-02 shared contacts', () => {
  for (const page of ['home', 'about']) {
    const content = () => page === 'home' ? <HomeContent data={{ settings, news: { status: 'empty' } }} /> : <AboutContent data={{ settings, photos: { status: 'success', data: [] } }} />;
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
  it('rejects invalid coordinates and keeps external route with missing embed', () => {
    for (const value of [null, {}, { latitude: 91, longitude: 1 }, { lat: 0, lng: Infinity }, { latitude: '59', longitude: 29 }]) expect(parseCoordinates(value)).toBeUndefined();
    expect(parseCoordinates({ lat: 0, lng: 0 })).toEqual({ lat: 0, lng: 0 });
    const { container, getByRole } = render(<MapEmbed address="Адрес клуба" mapsUrl="https://yandex.ru/maps/" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByRole('link', { name: 'Открыть маршрут' }).getAttribute('rel')).toBe('noopener noreferrer');
  });
});
