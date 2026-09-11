import type { ReactNode } from "react";
import { Icon, ResponsiveImage, SectionLabel } from "../atoms";
import type { HorseSummary, NewsSummary, PriceSummary, PriceTable } from "../cards";
import { HorseCard, NewsCard, PriceRow, ServiceCard } from "../cards";
import { Button, PaginationLoadMore, TextLink } from "../controls";
import { EmptyState, ErrorBlock, InlineNotice, Skeleton } from "../feedback";
import { PageContainer, Section, Text } from "../foundations";
import { Carousel, MapEmbed, type ImageSource } from "../media";
import styles from "./sections.module.css";

type Action = { label: string; href?: string; onClick?: () => void };
type AsyncState = "loading" | "empty" | "error" | "success";

function Actions({ actions }: { actions?: Action[] }) {
  const valid = actions?.filter((action) => action.label.trim()).slice(0, 2) ?? [];
  if (!valid.length) return null;
  return <div className={styles.actions}>{valid.map((action, index) => <Button key={`${action.label}-${index}`} variant={index === 0 ? "primary" : "secondary"} href={action.href} onClick={action.onClick}>{action.label}</Button>)}</div>;
}

type IntroProps = { eyebrow?: string; title: string; body?: string; image?: ImageSource; imageSide?: "left" | "right"; actions?: Action[]; headingLevel?: 1 | 2 };
export function IntroSection({ eyebrow, title, body, image, imageSide = "right", actions, headingLevel = 2 }: IntroProps) {
  const headingId = `intro-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return <Section headingId={headingId} spacing="editorial"><PageContainer><div className={`${styles.intro} ${imageSide === "left" ? styles.introImageLeft : ""}`}><div className={styles.copy}><SectionLabel text={eyebrow} /><Text as={Heading} id={headingId} variant={headingLevel === 1 ? "h1" : "h2"}>{title}</Text>{body?.trim() ? <Text variant="body-l">{body}</Text> : null}<Actions actions={actions} /></div>{image?.src ? <div className={styles.introMedia}><ResponsiveImage {...image} ratio="16:10" /></div> : null}</div></PageContainer></Section>;
}

export function EditorialSplitSection({ eyebrow, title, body, image, imageSide = "left", actions, headingLevel = 2 }: IntroProps) {
  const headingId = `editorial-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return <Section headingId={headingId}><PageContainer><div className={`${styles.split} ${imageSide === "right" ? styles.imageRight : ""}`}><div className={styles.copy}><SectionLabel text={eyebrow} /><Text as={Heading} id={headingId} variant={headingLevel === 1 ? "h1" : "h2"}>{title}</Text>{body?.trim() ? <Text>{body}</Text> : null}<Actions actions={actions} /></div>{image?.src ? <div className={styles.splitMedia}><ResponsiveImage {...image} ratio="4:5" /></div> : null}</div></PageContainer></Section>;
}

export type BenefitItem = { title: string; text?: string };
export function BenefitsSection({ title, items, tone = "ivory" }: { title?: string; items: BenefitItem[]; tone?: "ivory" | "sand" | "sage" }) {
  const valid = items.filter((item) => item.title.trim());
  if (!valid.length) return null;
  const headingId = title?.trim() ? "benefits-heading" : undefined;
  return <Section tone={tone} headingId={headingId}><PageContainer>{title?.trim() ? <Text as="h2" id={headingId} variant="h2">{title}</Text> : null}<div className={styles.benefits}>{valid.map((item, index) => <article key={`${item.title}-${index}`}><span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><Text as="h3" variant="h4">{item.title}</Text>{item.text?.trim() ? <Text>{item.text}</Text> : null}</article>)}</div></PageContainer></Section>;
}

export type SectionPrice = PriceSummary & { price_tables?: PriceTable[] };
export function PricesSection({ items, mode, notice, filter, state = "success", errorMessage = "Не удалось загрузить стоимость.", onRetry, onRequest }: { items: SectionPrice[]; mode: "featured" | "lessons" | "rides" | "boarding"; notice?: string; filter?: ReactNode; state?: AsyncState; errorMessage?: string; onRetry?: () => void; onRequest: (price: SectionPrice) => void }) {
  const headingId = `prices-${mode}`;
  return <Section tone="sage" headingId={headingId}><PageContainer><div className={styles.heading}><Text as="h2" id={headingId} variant="h2">Стоимость</Text>{filter}</div>{state === "loading" ? <Skeleton variant="card" count={2} label="Загрузка стоимости" /> : state === "error" ? <ErrorBlock message={errorMessage} onRetry={onRetry} /> : state === "empty" || !items.length ? <EmptyState title="Стоимость уточняется" message="Оставьте заявку — мы подберём подходящий вариант." action={<Button onClick={() => onRequest({ name: "Стоимость уточняется" })}>Уточнить стоимость</Button>} /> : <div className={mode === "featured" ? styles.priceCards : styles.priceRows}>{items.map((item, index) => item.price_tables ? <PriceRow key={item.slug ?? `${item.name}-${index}`} name={item.name} description={item.description} priceTables={item.price_tables} onRequest={() => onRequest(item)} /> : <ServiceCard key={item.slug ?? `${item.name}-${index}`} price={item} onRequest={() => onRequest(item)} />)}</div>}{notice?.trim() ? <InlineNotice message={notice} /> : null}</PageContainer></Section>;
}

export function HorsesSection({ horses, mode, intro, emptyText = "Скоро познакомим вас с лошадьми клуба", ctaLabel, state = "success", errorMessage = "Не удалось загрузить лошадей.", onRetry, onRequest, onToggle }: { horses: HorseSummary[]; mode: "grid" | "carousel"; intro?: string; emptyText?: string; ctaLabel: string; state?: AsyncState; errorMessage?: string; onRetry?: () => void; onRequest: (horse?: HorseSummary) => void; onToggle: (horse: HorseSummary) => void }) {
  const cards = horses.map((horse, index) => <HorseCard key={`${horse.name}-${index}`} horse={horse} onToggle={() => onToggle(horse)} onRequest={() => onRequest(horse)} />);
  return <Section headingId="horses-heading"><PageContainer><Text as="h2" id="horses-heading" variant="h2">Наши лошади</Text>{intro?.trim() ? <Text variant="body-l">{intro}</Text> : null}{state === "loading" ? <Skeleton count={3} label="Загрузка лошадей" /> : state === "error" ? <ErrorBlock message={errorMessage} onRetry={onRetry} /> : state === "empty" || !horses.length ? <EmptyState title={emptyText} action={<Button onClick={() => onRequest()}>{ctaLabel}</Button>} /> : mode === "carousel" ? <Carousel items={horses.map((horse) => horse.photo ?? {})} renderItem={(_, index) => cards[index]} /> : <div className={styles.horseGrid}>{cards}</div>}</PageContainer></Section>;
}

export function NewsSection({ items, total, mode, state = "success", emptyText = "Новостей пока нет", errorMessage = "Не удалось загрузить новости.", archiveHref = "/novosti", pagination, onRetry, onOpen }: { items: NewsSummary[]; total: number; mode: "latest" | "archive"; state?: AsyncState; emptyText?: string; errorMessage?: string; archiveHref?: string; pagination?: { page: number; pending?: boolean; error?: string; label?: string; onLoadMore: (page: number) => void }; onRetry?: () => void; onOpen?: (news: NewsSummary) => void }) {
  return <Section headingId="news-heading"><PageContainer><div className={styles.heading}><Text as="h2" id="news-heading" variant="h2">Новости</Text><TextLink href={archiveHref}>Все новости</TextLink></div>{state === "loading" ? <Skeleton count={mode === "latest" ? 1 : 3} label="Загрузка новостей" /> : state === "error" ? <ErrorBlock message={errorMessage} onRetry={onRetry} /> : state === "empty" || !items.length ? mode === "latest" ? null : <EmptyState title={emptyText} /> : <><div className={styles.newsGrid}>{items.map((news, index) => <NewsCard key={news.id} news={news} featured={mode === "latest" && index === 0} href={news.href || (news.slug ? `/novosti/${encodeURIComponent(news.slug)}` : undefined)} onOpen={onOpen ? () => onOpen(news) : undefined} />)}</div>{mode === "archive" && pagination ? <PaginationLoadMore page={pagination.page} loaded={items.length} total={total} pending={pagination.pending} error={pagination.error} label={pagination.label} onLoadMore={pagination.onLoadMore} /> : null}</>}</PageContainer></Section>;
}

export type SocialLink = { type?: "vk" | "instagram"; label: string; href: string };
export function ContactSection({ address, nearestStop, coordinates, mapsUrl, phone, workingHours, socialLinks, ctaLabel, context, onRequest }: { address?: string; nearestStop?: string; coordinates?: { lat: number; lng: number }; mapsUrl?: string; phone?: string; workingHours?: string; socialLinks: SocialLink[]; ctaLabel: string; context: string; onRequest: (context: string) => void }) {
  const validSocials = socialLinks.filter((link) => link.label.trim() && /^https?:\/\//i.test(link.href));
  const rawPhone = phone?.replace(/[^+\d]/g, "");
  return <Section tone="forest" headingId="contacts-heading"><PageContainer><div className={styles.contacts}><div className={styles.contactCopy}><Text as="h2" id="contacts-heading" variant="h2" tone="inverse">Контакты</Text>{address?.trim() ? <address><p>{address}</p></address> : null}{nearestStop?.trim() ? <p>{nearestStop}</p> : null}{workingHours?.trim() ? <p>{workingHours}</p> : null}{rawPhone || validSocials.length ? <ul className={styles.contactChannels}>{rawPhone ? <li><a href={`tel:${rawPhone}`} target="_blank" rel="noopener noreferrer"><Icon name="phone" size={24} /><span>{/^\+7\d{10}$/.test(rawPhone) ? rawPhone.replace(/^(\+7)(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3-$4-$5") : phone}</span></a></li> : null}{validSocials.map((link) => { const isVk = link.type === "vk" || /^(VK|ВКонтакте)$/i.test(link.label); return <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer"><Icon name={isVk ? "vk" : "instagram"} size={24} /><span>{isVk ? "VK" : link.label}</span></a></li>; })}</ul> : null}<Button onClick={() => onRequest(context)}>{ctaLabel}</Button></div>{coordinates || mapsUrl ? <MapEmbed address={address ?? "Клуб «Инлав»"} coordinates={coordinates} mapsUrl={mapsUrl} /> : null}</div></PageContainer></Section>;
}

export type InformationBlock = { title: string; body?: string; items?: string[] };
function InformationSection({ title, blocks, verifiedOnly = false }: { title: string; blocks: InformationBlock[]; verifiedOnly?: boolean }) {
  const valid = blocks.filter((block) => block.title.trim() && (block.body?.trim() || block.items?.some((item) => item.trim())));
  if (!valid.length) return null;
  const headingId = `${title.replace(/\s+/g, "-").toLowerCase()}-heading`;
  return <Section headingId={headingId}><PageContainer><Text as="h2" id={headingId} variant="h2">{title}</Text>{verifiedOnly ? <Text variant="meta">Проверенная информация клуба</Text> : null}<div className={styles.infoGrid}>{valid.map((block, index) => <article key={`${block.title}-${index}`}><Text as="h3" variant="h4">{block.title}</Text>{block.body?.trim() ? <Text>{block.body}</Text> : null}{block.items?.filter((item) => item.trim()).length ? <ul>{block.items.filter((item) => item.trim()).map((item) => <li key={item}>{item}</li>)}</ul> : null}</article>)}</div></PageContainer></Section>;
}
export function PreparationSafetySection(props: { blocks: InformationBlock[]; verifiedOnly?: boolean }) { return <InformationSection title="Подготовка и безопасность" {...props} />; }
export function ConditionsSection(props: { blocks: InformationBlock[]; verifiedOnly?: boolean }) { return <InformationSection title="Условия" {...props} />; }

const privacyFallback = "Имя, телефон и комментарий используются только для ответа на обращение. Чтобы отозвать согласие, свяжитесь с клубом по опубликованным контактам.";
export function PrivacySection({ id = "privacy", text, updatedAt }: { id?: "privacy"; text?: string; updatedAt?: string }) {
  const paragraphs = (text?.trim() || privacyFallback).split(/\n{2,}/).filter(Boolean);
  return <Section id={id} headingId="privacy-heading"><PageContainer size="default"><div className={styles.privacy}><Text as="h2" id="privacy-heading" variant="h2">Обработка персональных данных</Text>{paragraphs.map((paragraph, index) => <Text key={index}>{paragraph}</Text>)}{updatedAt?.trim() ? <Text as="p" variant="meta">Обновлено: <time dateTime={updatedAt}>{updatedAt}</time></Text> : null}</div></PageContainer></Section>;
}
