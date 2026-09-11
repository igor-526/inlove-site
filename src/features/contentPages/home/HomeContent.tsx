import { parseCoordinates } from "@/ui/media/coordinates";
import type { Metadata } from 'next';
import { NewsSection } from '@/ui/sections';
import { PageContainer, Section, Text } from '@/ui/foundations';
import type { NewsSummary } from '@/ui/cards';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeSharedSettings } from '@/features/siteSettings/services/getSiteSettings';
import { settingObject, settingText, type loadHomeData } from '../services/loaders';
import { HomeContacts, HomeHero } from './InteractiveSections';
import { SITE_CONSUMER_CONFIG } from '@/features/siteSettings';
import styles from './home.module.css';

type HomeData = Awaited<ReturnType<typeof loadHomeData>>;
function safeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? value : undefined; }
  catch { return undefined; }
}
export function homeMetadata(): Metadata {
  return {
    title: SITE_CONSUMER_CONFIG.seo.homeTitle,
    description: SITE_CONSUMER_CONFIG.seo.defaultDescription,
    alternates: { canonical: '/' },
  };
}
export function HomeContent({ data }: { data: HomeData }) {
  const settings = data.settings.status === 'success' ? data.settings.data : [];
  const shared = normalizeSharedSettings(settings);
  const latest = data.news.status === 'success' ? data.news.data[0] : undefined;
  const coordinates = parseCoordinates(settingObject(settings, 'contacts.coordinates'));
  const timezone = SITE_CONSUMER_CONFIG.news.timezone;
  const latestPhoto = latest?.photos.find((photo) => photo.is_main) ?? latest?.photos[0];
  const newsItems: NewsSummary[] = latest ? [{
    id: latest.id, name: latest.name, slug: latest.slug,
    snippet: latest.snippet?.trim() || undefined,
    published_at: latest.published_at,
    published_at_formatted: new Date(latest.published_at).toLocaleDateString('ru-RU', { timeZone: timezone }),
    photo: { src: safeUrl(latestPhoto?.url), alt: latest.name },
  }] : [];
  return <>
    <HomeHero title={settingText(settings, 'home.hero_title') ?? SITE_CONSUMER_CONFIG.home.heroTitle}
      subtitle={settingText(settings, 'home.hero_subtitle')} label={SITE_CONSUMER_CONFIG.home.heroCtaLabel}
      image={{ src: '/images/070-home-hero.jpg', alt: '' }} />
    <Section spacing="compact" headingId="home-services-heading"><PageContainer>
      <div className={styles.servicesHeading}>
        <Text as="h2" id="home-services-heading" variant="h2">Услуги</Text>
      </div>
      <nav aria-label="Услуги клуба" className={styles.links}>
      {[
        { label: 'Занятия', href: '/uslugi/zanyatiya', icon: 'lessons' },
        { label: 'Прогулки', href: '/uslugi/progulki', icon: 'rides' },
        { label: 'Абонементы', href: '/uslugi/zanyatiya', icon: 'passes' },
        { label: 'Постой', href: '/uslugi/postoy', icon: 'boarding' },
      ].map(({ label, href, icon }) => <Link key={icon} href={href} className={styles.serviceCard}>
        <Image src={`/icons/070-${icon}.svg`} width={32} height={32} alt="" aria-hidden="true" />
        <span>{label}</span><span aria-hidden="true" className={styles.arrow}>↗</span>
      </Link>)}
      </nav>
    </PageContainer></Section>
    <NewsSection items={newsItems} total={newsItems.length} mode="latest" state={data.news.status} />
    <HomeContacts address={shared.address} nearestStop={shared.nearestStop} coordinates={coordinates}
      mapsUrl={safeUrl(shared.mapsUrl)} phone={shared.phone} workingHours={shared.workingHours}
      socialLinks={shared.socialLinks.filter((link) => safeUrl(link.href))} ctaLabel="Обратный звонок" />
  </>;
}
