import { parseCoordinates } from "@/ui/media/coordinates";
import { IntroSection, EditorialSplitSection } from '@/ui/sections';
import { Section, PageContainer } from '@/ui/foundations';
import { ErrorBlock } from '@/ui/feedback';
import { normalizeSharedSettings } from '@/features/siteSettings/services/getSiteSettings';
import { loadAboutData, settingText } from '../services/loaders';
import { AboutContact } from './Contact';

export function AboutContent({ data }: { data: Awaited<ReturnType<typeof loadAboutData>> }) {
  const settings = data.settings.status === 'success' ? data.settings.data : [];
  const get = (key: string) => settingText(settings, key);
  const shared = normalizeSharedSettings(settings);
  const first = { title: get('about_1_title'), text: get('about_1_text') };
  const second = { title: get('about_2_title'), text: get('about_2_text') };
  const coordinates = parseCoordinates(shared.coordinates);
  const safeUrl = (value?: string) => value && /^https?:\/\//i.test(value) ? value : undefined;
  return <>
    {first.title && first.text ? <IntroSection title={first.title} headingLevel={1} body={first.text} /> : <IntroSection title="О клубе" headingLevel={1} />}
    {data.settings.status === 'error' ? <Section><PageContainer><ErrorBlock message="Часть информации о клубе временно недоступна." /></PageContainer></Section> : null}
    {second.title && second.text ? <EditorialSplitSection title={second.title} body={second.text} /> : null}
    <AboutContact address={shared.address} nearestStop={shared.nearestStop} coordinates={coordinates}
      mapsUrl={safeUrl(shared.mapsUrl)} phone={shared.phone} workingHours={shared.workingHours}
      socialLinks={shared.socialLinks.filter((link) => safeUrl(link.href))} ctaLabel="Обратный звонок" />
  </>;
}
