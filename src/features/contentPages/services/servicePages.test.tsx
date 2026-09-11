// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LessonsContent, lessonsMetadata } from '../lessons/LessonsContent';
import { RidesContent, ridesMetadata } from '../rides/RidesContent';
import { BoardingContent, boardingMetadata } from '../boarding/BoardingContent';

afterEach(cleanup);
const group = (name: string, slug: string) => ({ status: 'success' as const, data: {
  id: '123e4567-e89b-42d3-a456-426614174000' as never, name, slug, description: `API: ${name}`,
  price: 0, created_at: '2026-09-11T00:00:00Z', updated_at: null,
} });
const data = (name: string, slug: string) => ({
  group: group(name, slug), prices: { status: 'empty' as const },
  settings: { status: 'success' as const, data: [{ key: 'services.notice', value: 'LEGACY', type: 'string' }] },
});

it.each([
  ['Занятия', 'zanyatiya', LessonsContent, lessonsMetadata, '/uslugi/zanyatiya'],
  ['Прогулки', 'progulki', RidesContent, ridesMetadata, '/uslugi/progulki'],
  ['Постой', 'postoy', BoardingContent, boardingMetadata, '/uslugi/postoy'],
] as const)('renders %s API description in SSR composition and ignores legacy settings', (name, slug, Component, metadata, canonical) => {
  const value = data(name, slug);
  const { container } = render(<Component data={value} />);
  expect(container.querySelectorAll('h1')).toHaveLength(1);
  expect(container.textContent).toContain(`API: ${name}`);
  expect(container.textContent).not.toContain('LEGACY');
  expect(metadata(value)).toMatchObject({ description: `API: ${name}`, alternates: { canonical } });
});
