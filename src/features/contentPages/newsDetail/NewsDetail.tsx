import Link from "next/link";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { ResponsiveImage } from "@/ui/atoms";
import { sanitizeContent } from "@/lib/content/sanitize";
import type { loadNewsDetail } from "../services/loaders";
import styles from "./detail.module.css";

export const detailHref = (slug: string) => `/novosti/${encodeURIComponent(slug)}`;
function dateLabel(value: string, timezone: string) {
  const options = { day: "numeric", month: "long", year: "numeric" } as const;
  try { return new Intl.DateTimeFormat("ru-RU", { ...options, timeZone: timezone }).format(new Date(value)); }
  catch { return new Intl.DateTimeFormat("ru-RU", { ...options, timeZone: "Europe/Moscow" }).format(new Date(value)); }
}

export function NewsDetail({ state, slug, timezone }: {
  state: Awaited<ReturnType<typeof loadNewsDetail>>; slug: string; timezone: string;
}) {
  const news = state.status === "success" ? state.data : undefined;
  return <Section spacing="editorial" headingId="news-detail-title"><PageContainer>
    <article className={styles.article}>
      <Link className={styles.link} href="/novosti">Все новости</Link>
      <header><Text as="h1" id="news-detail-title" variant="display-l">{news?.name ?? "Новость временно недоступна"}</Text>
        {news ? <Text as="time" variant="body-s" dateTime={news.published_at}>{dateLabel(news.published_at, timezone)}</Text> : null}
      </header>
      {news ? <>
        {news.photos.length ? <div className={styles.photos}>{[...news.photos].sort((a, b) => Number(b.is_main) - Number(a.is_main)).map((photo, index) => <ResponsiveImage key={photo.id} src={/^(https?:\/\/|\/(?!\/))/.test(photo.url) ? photo.url : undefined} alt={`${news.name} — фото ${index + 1}`} ratio="16:10" priority={index === 0} />)}</div> : null}
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: sanitizeContent(news.content) }} />
      </> : <div role="status"><Text>Не удалось загрузить новость. Попробуйте ещё раз.</Text><a className={styles.link} href={detailHref(slug)}>Повторить запрос</a></div>}
    </article>
  </PageContainer></Section>;
}
