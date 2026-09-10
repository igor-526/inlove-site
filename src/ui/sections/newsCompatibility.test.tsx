// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { NewsCard } from '../cards';
import { NewsSection } from './index';
afterEach(cleanup);
const news = { id: '1', name: 'Новость клуба', slug: 'novost', published_at: '2026-09-01T22:00:00Z', published_at_formatted: '2 сентября 2026 г.' };
it('renders native SSR navigation and a semantic date with a timezone-formatted label', () => {
  const html = renderToStaticMarkup(<NewsSection mode="latest" items={[news]} total={1} />);
  expect(html).toContain('href="/novosti/novost"');
  expect(html).toContain('dateTime="2026-09-01T22:00:00Z"');
  expect(html).toContain('2 сентября 2026 г.');
});
it('forwards explicit href ahead of slug', () => {
  const { getByRole } = render(<NewsSection mode="latest" items={[{ ...news, href: '/novosti/exact' }]} total={1} />);
  expect(getByRole('link', { name: 'Открыть новость' }).getAttribute('href')).toBe('/novosti/exact');
});
it('retains legacy callback navigation when a link is absent', () => {
  const onOpen = vi.fn();
  const legacy = { id: 2, name: 'Старая карточка' };
  const { getByRole } = render(<NewsSection mode="latest" items={[legacy]} total={1} onOpen={onOpen} />);
  fireEvent.click(getByRole('button', { name: 'Открыть новость' }));
  expect(onOpen).toHaveBeenCalledWith(legacy);
});
it('does not invent an action or date when the card lacks them', () => {
  const { container, queryByRole } = render(<NewsCard news={{ id: 1, name: 'Анонс' }} />);
  expect(queryByRole('button')).toBeNull();
  expect(queryByRole('link')).toBeNull();
  expect(container.querySelector('time')).toBeNull();
});
it('keeps archive navigation when the latest list is empty', () => {
  const html = renderToStaticMarkup(<NewsSection mode="latest" items={[]} total={0} />);
  expect(html).toContain('href="/novosti"');
  expect(html).not.toContain('<article');
});
