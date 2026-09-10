'use client';
import type { ComponentProps } from 'react';
import styles from './home.module.css';
import { HeroMedia } from '@/ui/media';
import { ContactSection } from '@/ui/sections';
import { CALLBACK_REQUEST_EVENT } from '@/features/siteChrome/SiteChrome';
export function requestHomeCallback(serviceName?: string, serviceSlug?: string) {
  window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: 'Главная', serviceName, serviceSlug } }));
}
export function HomeHero({ title, subtitle, label, image }: { title: string; subtitle?: string; label: string; image: ComponentProps<typeof HeroMedia>['image'] }) {
  return <div className={styles.heroPhoto}><HeroMedia image={image} title={title} subtitle={subtitle} primaryAction={{ label, onClick: () => requestHomeCallback() }} /></div>;
}
export function HomeContacts(props: Omit<ComponentProps<typeof ContactSection>, 'onRequest' | 'context'>) {
  return <ContactSection {...props} context="Главная" onRequest={() => requestHomeCallback()} />;
}
