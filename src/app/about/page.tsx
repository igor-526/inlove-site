import type { Metadata } from 'next';
import { AboutContent } from '@/features/contentPages/about/AboutContent';
import { loadAboutData } from '@/features/contentPages/services/loaders';
import { contentPlainText } from '@/lib/content/sanitize';
import { SITE_CONSUMER_CONFIG } from '@/features/siteSettings';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: contentPlainText(SITE_CONSUMER_CONFIG.seo.aboutTitle),
    description: contentPlainText(SITE_CONSUMER_CONFIG.seo.defaultDescription),
    alternates: { canonical: '/about' },
  };
}
export default async function AboutPage() {
  return <AboutContent data={await loadAboutData()} />;
}
