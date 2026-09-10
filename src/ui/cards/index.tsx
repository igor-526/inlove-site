import type { ReactNode } from "react";
import { Badge, PriceValue, ResponsiveImage } from "../atoms";
import { Button, TextLink } from "../controls";
import type { ImageSource } from "../media";
import styles from "./cards.module.css";

export type PriceSummary = { name: string; slug?: string; description?: string; photo?: ImageSource; price?: string | number | null; duration?: string };
export function ServiceCard({ price, href, onRequest }: { price: PriceSummary; href?: string; onRequest: (price: PriceSummary) => void }) {
  return <article className={styles.card}><ResponsiveImage {...price.photo} alt={price.photo?.alt ?? price.name} ratio="4:5" /><div className={styles.cardBody}><h3>{price.name}</h3>{price.description?.trim() ? <p>{price.description}</p> : null}<PriceValue value={price.price} duration={price.duration} /><div className={styles.actions}>{href ? <TextLink href={href}>Подробнее</TextLink> : null}<Button variant="secondary" onClick={() => onRequest(price)}>Записаться</Button></div></div></article>;
}

export type PriceTable = { id?: string; label: string; value?: string | number | null; duration?: string };
export function PriceRow({ name, description, priceTables, onRequest }: { name: string; description?: string; priceTables: PriceTable[]; onRequest: () => void }) {
  return <article className={styles.priceRow}><div><h3>{name}</h3>{description?.trim() ? <p>{description}</p> : null}</div><div className={styles.priceOffers}>{priceTables.length ? priceTables.map((item, index) => <div className={styles.priceOffer} key={item.id ?? `${item.label}-${index}`}><span>{item.label}</span><PriceValue value={item.value} duration={item.duration} /></div>) : <PriceValue value={null} />}</div><Button variant="ghost" onClick={onRequest}>Записаться</Button></article>;
}

export type HorseSummary = { name: string; pedigree_name?: string; description?: string; breed?: string; coat_color?: string; height?: string | number; sex?: string; bdate_formatted?: string; age?: string; photo?: ImageSource; services?: string[] };
export function HorseCard({ horse, expanded = false, onToggle, onRequest }: { horse: HorseSummary; expanded?: boolean; onToggle: () => void; onRequest: () => void }) {
  const traits = [horse.breed, horse.coat_color, horse.sex, horse.age, horse.height ? `${horse.height} см` : undefined].filter(Boolean) as string[];
  return <article className={styles.horse}><ResponsiveImage {...horse.photo} alt={horse.photo?.alt ?? horse.name} ratio="4:5" /><div className={styles.cardBody}><h3>{horse.name}</h3>{horse.pedigree_name?.trim() ? <p className={styles.meta}>{horse.pedigree_name}</p> : null}<div className={styles.badges}>{traits.map((trait) => <Badge key={trait} tone="nature">{trait}</Badge>)}</div>{horse.description?.trim() ? <p>{horse.description}</p> : null}<button className={styles.toggle} type="button" aria-expanded={expanded} onClick={onToggle}>{expanded ? "Скрыть подробности" : "Показать подробности"}</button>{expanded ? <>{horse.bdate_formatted?.trim() ? <p className={styles.meta}>Дата рождения: {horse.bdate_formatted}</p> : null}{horse.services?.length ? <ul>{horse.services.map((service) => <li key={service}>{service}</li>)}</ul> : null}</> : null}<Button variant="secondary" onClick={onRequest}>Записаться с {horse.name}</Button></div></article>;
}

export type NewsSummary = { id: string | number; name: string; snippet?: string; slug?: string; href?: string; published_at?: string; published_at_formatted?: string; photo?: ImageSource };
export function NewsCard({ news, featured = false, href, onOpen }: { news: NewsSummary; featured?: boolean; href?: string; onOpen?: () => void }) {
  return <article className={`${styles.card} ${featured ? styles.featured : ""}`}><ResponsiveImage {...news.photo} alt={news.photo?.alt ?? news.name} ratio={featured ? "16:10" : "3:2"} /><div className={styles.cardBody}>{news.published_at?.trim() ? <time className={styles.meta} dateTime={news.published_at}>{news.published_at_formatted?.trim() || news.published_at}</time> : null}<h3>{news.name}</h3>{news.snippet?.trim() ? <p>{news.snippet}</p> : null}{href ? <Button variant="ghost" href={href}>Открыть новость</Button> : onOpen ? <Button variant="ghost" onClick={onOpen}>Открыть новость</Button> : null}</div></article>;
}

export function PersonCard({ name, roles, phone, status }: { name: string; roles: string[]; phone?: string; status?: string }) {
  if (!name.trim()) return null;
  return <article className={styles.person}><h3>{name}</h3>{roles.filter(Boolean).length ? <p>{roles.filter(Boolean).join(" · ")}</p> : null}{status?.trim() ? <Badge tone="neutral">{status}</Badge> : null}{phone?.trim() ? <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : null}</article>;
}
export function FeatureItem({ id, label, value, note }: { id: string; label: string; value: ReactNode; note?: string }) {
  if (!label.trim() || value === null || value === undefined || value === "") return null;
  return <div className={styles.feature} id={id}><span className={styles.meta}>{label}</span><strong>{value}</strong>{note?.trim() ? <p>{note}</p> : null}</div>;
}
export function ReviewSummary({ rating, rating_count, review_count, strengths, collected_at }: { rating: number; rating_count: number; review_count: number; strengths: string[]; collected_at: string }) {
  if (!Number.isFinite(rating) || review_count <= 0) return null;
  return <figure className={styles.review}><blockquote>Оценка {rating.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} из 5</blockquote><figcaption>{review_count} отзывов · {rating_count} оценок{collected_at ? ` · данные на ${collected_at}` : ""}</figcaption>{strengths.filter(Boolean).length ? <ul>{strengths.filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul> : null}</figure>;
}
