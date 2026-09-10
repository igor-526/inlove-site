import { parseCoordinates } from "@/ui/media/coordinates";
import { z } from 'zod';
import { IntroSection, EditorialSplitSection, BenefitsSection } from '@/ui/sections';
import { PersonCard, ReviewSummary } from '@/ui/cards';
import { Gallery } from '@/ui/media';
import { Section, PageContainer, Text } from '@/ui/foundations';
import { ErrorBlock } from '@/ui/feedback';
import { normalizeSharedSettings } from '@/features/siteSettings/services/getSiteSettings';
import { loadAboutData, settingObject, settingText } from '../services/loaders';
import { AboutContact } from './Contact';
import styles from './about.module.css';

const text = z.string().trim().min(1);
const person = z.object({ name: text, roles: z.array(text).default([]), phone: text.optional(), approved: z.boolean().optional(), status: text.optional() });
const feature = z.object({ label: text, value: z.union([text, z.boolean(), z.number()]), approved: z.boolean().optional(), status: text.optional() });
const review = z.object({ rating: z.number().min(0).max(5), rating_count: z.number().int().nonnegative(), review_count: z.number().int().positive(), strengths: z.array(text).default([]), collected_at: text });
const safeUrl = (value?: string) => value && /^https?:\/\//i.test(value) ? value : undefined;
function entries<T>(value: unknown, schema: z.ZodType<T>): T[] {
  return Array.isArray(value) ? value.flatMap((item) => { const parsed = schema.safeParse(item); return parsed.success ? [parsed.data] : []; }) : [];
}
// Approval is explicit; imported/reported seed statuses do not authorize publication.
const approved = (item: { approved?: boolean; status?: string }) => item.approved === true || item.status === 'approved';

export function AboutContent({ data }: { data: Awaited<ReturnType<typeof loadAboutData>> }) {
  const settings = data.settings.status === 'success' ? data.settings.data : [];
  const get = (key: string) => settingText(settings, key);
  const object = (key: string) => settingObject(settings, key);
  const shared = normalizeSharedSettings(settings);
  const team = entries(object('team.people'), person).filter(approved);
  const benefits = entries(object('about.features'), feature).filter(approved).filter((item) => item.value !== false).map((item) => ({ title: item.label, text: item.value === true ? undefined : String(item.value) }));
  const summary = review.safeParse(object('reviews.summary'));
  const available = data.photos.status === 'success' ? data.photos.data : [];
  const selection = z.array(text).safeParse(object('about.gallery_photo_ids'));
  const photos = selection.success ? [...new Set(selection.data)].flatMap((id) => available.filter((photo) => photo.id === id)) : available;
  const images = photos.filter((photo) => safeUrl(photo.url)).map((photo) => ({ src: photo.url, alt: photo.description?.trim() || 'Атмосфера конного клуба «Инлав»' }));
  const coordinates = parseCoordinates(object('contacts.coordinates'));
  return <>
    <IntroSection title="О клубе" headingLevel={1} body={get('about.intro') ?? 'Конный клуб «Инлав»: занятия, прогулки и жизнь рядом с лошадьми.'} />
    {data.settings.status === 'error' ? <Section><PageContainer><ErrorBlock message="Часть информации о клубе временно недоступна." /></PageContainer></Section> : null}
    {get('about.setting') ? <EditorialSplitSection title="Окружение и инфраструктура" body={get('about.setting')} image={images[0]} /> : null}
    <BenefitsSection title="Инфраструктура клуба" items={benefits} tone="sage" />
    {images.length || data.photos.status === 'error' ? <Section headingId="about-gallery"><PageContainer><Text as="h2" variant="h2" id="about-gallery">Атмосфера клуба</Text>{data.photos.status === 'error' ? <ErrorBlock message="Фотографии временно недоступны." /> : <Gallery items={images} />}</PageContainer></Section> : null}
    {team.length ? <Section headingId="about-team"><PageContainer><Text as="h2" variant="h2" id="about-team">Команда</Text><div className={styles.grid}>{team.map((member, index) => <PersonCard key={`${member.name}-${index}`} name={member.name} roles={member.roles} phone={member.phone} />)}</div></PageContainer></Section> : null}
    {summary.success ? <Section tone="sand" headingId="about-reviews"><PageContainer><Text as="h2" variant="h2" id="about-reviews">Отзывы о клубе</Text><ReviewSummary {...summary.data} /></PageContainer></Section> : null}
    <AboutContact address={shared.address ?? 'Уточните адрес и маршрут у клуба перед поездкой.'} alternativeAddress={get('contacts.address_alternative')} coordinates={coordinates} mapsUrl={safeUrl(shared.mapsUrl)} phone={shared.phone} workingHours={shared.workingHours} socialLinks={shared.socialLinks.filter((link) => safeUrl(link.href))} ctaLabel="Обратный звонок" />
  </>;
}
