// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SiteChrome } from '@/features/siteChrome';
import { FALLBACK_SHARED_SETTINGS } from '@/features/siteSettings/services/getSiteSettings';
import { UnderConstructionPage } from './UnderConstructionPage';
import { PLACEHOLDER_ROUTES } from './metadata';
vi.mock('next/navigation', () => ({ usePathname: () => window.location.pathname }));
afterEach(cleanup);
it.each(['lessons', 'rides', 'boarding', 'horses'] as const)('retains chrome and callback around %s', (key) => {
  const route = PLACEHOLDER_ROUTES[key];
  window.history.replaceState({}, '', route.path);
  const { container } = render(<SiteChrome settings={FALLBACK_SHARED_SETTINGS}><UnderConstructionPage heading={route.heading} /></SiteChrome>);
  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('contentinfo')).toBeTruthy();
  expect(container.querySelectorAll('h1')).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(route.heading);
  expect(screen.getByText(/раздел находится в разработке/i)).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', { name: FALLBACK_SHARED_SETTINGS.headerCtaLabel })[0]);
  expect(screen.getByRole('dialog', { name: FALLBACK_SHARED_SETTINGS.callback.title })).toBeTruthy();
  const policyLink = screen.getByRole('link', { name: 'Политика' });
  expect(policyLink.getAttribute('href')).toBe('/about#privacy');
  policyLink.focus();
  expect(document.activeElement).toBe(policyLink);
  expect(screen.getByRole('checkbox')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть форму' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});
