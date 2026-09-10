import { PageContainer, Section, Text } from "@/ui/foundations";
import { ResponsiveImage } from "@/ui/atoms";
import type { NewsPublicOutDto } from "@/types/news";
import type { loadNewsArchive } from "../services/loaders";
import { NEWS_PAGE_SIZE } from "../services/loaders";
import { QuestionButton } from "./QuestionButton";
import cards from "@/ui/cards/cards.module.css";
import styles from "./archive.module.css";

export const archiveHref = (page: number) => page === 1 ? "/novosti" : `/novosti?page=${page}`;

export function newsDate(value: string, timezone: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeZone: timezone }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeZone: "Europe/Moscow" }).format(new Date(value));
  }
}

function ArchiveCard({ news, featured, timezone }: { news: NewsPublicOutDto; featured?: boolean; timezone: string }) {
  const photo = news.photos.find((item) => item.is_main) ?? news.photos[0];
  return <article className={`${cards.card} ${featured ? styles.featured : ""}`}>
    <ResponsiveImage src={photo?.url} alt={news.name} ratio={featured ? "16:10" : "3:2"} />
    <div className={cards.cardBody}>
      <time className={cards.meta} dateTime={news.published_at}>{newsDate(news.published_at, timezone)}</time>
      <Text as="h2" variant={featured ? "h2" : "h3"}><a className={styles.link} href={`/novosti/${encodeURIComponent(news.slug)}`}>{news.name}</a></Text>
      {news.snippet?.trim() ? <Text>{news.snippet}</Text> : null}
    </div>
  </article>;
}

export function NewsPagination({ page, total, nextLabel }: { page: number; total: number; nextLabel: string }) {
  const last = Math.ceil(total / NEWS_PAGE_SIZE);
  if (last < 2) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, last])].filter((value) => value >= 1 && value <= last).sort((a, b) => a - b);
  return <nav className={styles.pagination} aria-label="Страницы новостей">
    {page > 1 ? <a href={archiveHref(page - 1)} rel="prev">Назад</a> : null}
    {pages.map((value, index) => <span key={value}>
      {index > 0 && value - pages[index - 1] > 1 ? <span aria-hidden="true">…</span> : null}
      {value === page ? <span aria-current="page" aria-label={`Страница ${value}`}>{value}</span> : <a href={archiveHref(value)} aria-label={`Страница ${value}`}>{value}</a>}
    </span>)}
    {page < last ? <a href={archiveHref(page + 1)} rel="next">{nextLabel}</a> : null}
  </nav>;
}

export function NewsArchive({ state, page, intro, emptyText, nextLabel, timezone }: {
  state: Awaited<ReturnType<typeof loadNewsArchive>>; page: number;
  intro?: string; emptyText: string; nextLabel: string; timezone: string;
}) {
  const items = state.status === "success" ? state.data.items : [];
  return <Section spacing="editorial" headingId="news-title"><PageContainer><div className={styles.content}>
    <header><Text as="h1" id="news-title" variant="display-l">Новости клуба</Text>{intro ? <Text variant="body-l">{intro}</Text> : null}</header>
    {state.status === "error" ? <div role="status"><Text>Не удалось загрузить новости. Попробуйте ещё раз.</Text><a href={archiveHref(page)}>Повторить запрос</a></div> : null}
    {state.status === "empty" ? <Text>{emptyText}</Text> : null}
    {items[0] ? <ArchiveCard news={items[0]} featured timezone={timezone} /> : null}
    {items.length > 1 ? <div className={styles.grid}>{items.slice(1).map((news) => <ArchiveCard key={news.id} news={news} timezone={timezone} />)}</div> : null}
    {state.status === "success" ? <NewsPagination page={page} total={state.data.total} nextLabel={nextLabel} /> : null}
    <div><QuestionButton /></div>
  </div></PageContainer></Section>;
}
