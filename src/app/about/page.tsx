import type { Metadata } from 'next';
import { AboutContent } from '@/features/contentPages/about/AboutContent';
import { loadAboutData, loadContentSettings, settingText } from '@/features/contentPages/services/loaders';
import { contentPlainText } from '@/lib/content/sanitize';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const state = await loadContentSettings();
  const settings = state.status === 'success' ? state.data : [];
  return {
    title: contentPlainText(settingText(settings, 'seo.about.title') ?? 'Инлав | О клубе'),
    description: contentPlainText(settingText(settings, 'seo.about.description') ?? settingText(settings, 'seo.default_description') ?? 'Конный клуб «Инлав»: занятия, прогулки, постой лошадей и жизнь клуба.'),
    alternates: { canonical: '/about' },
  };
}
export default async function AboutPage() {
  return <AboutContent data={await loadAboutData()} />;
}
