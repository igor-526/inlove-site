import Link from "next/link";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { ResponsiveImage } from "@/ui/atoms";
import { TariffTable } from "@/ui/cards";
import type { loadBoardingDetail } from "../services/boardingLoaders";
import styles from "./detail.module.css";

export const detailHref = (slug: string) => `/uslugi/postoy/${encodeURIComponent(slug)}`;

export function BoardingDetail({ state, slug }: {
  state: Awaited<ReturnType<typeof loadBoardingDetail>>; slug: string;
}) {
  const price = state.status === "success" ? state.data : undefined;
  const tables = price?.price_tables.filter((table) => table.rows.length) ?? [];
  return <Section spacing="editorial" headingId="boarding-detail-title"><PageContainer>
    <article className={styles.article}>
      <Link className={styles.link} href="/uslugi/postoy">Все услуги постоя</Link>
      <header><Text as="h1" id="boarding-detail-title" variant="display-l">{price?.name ?? "Постой временно недоступен"}</Text></header>
      {price ? <>
        {price.photos.length ? <div className={styles.photos}>{[...price.photos].sort((a, b) => Number(b.is_main) - Number(a.is_main)).map((photo, index) => <ResponsiveImage key={photo.id} src={photo.url} alt={`${price.name} — фото ${index + 1}`} ratio="16:10" priority={index === 0} />)}</div> : null}
        {price.description?.trim() ? <Text variant="body-l">{price.description}</Text> : null}
        {tables.length ? tables.map((table, index) => <TariffTable key={index} table={table} />) : <Text>Стоимость и наличие мест уточняются — свяжитесь с клубом.</Text>}
      </> : <div role="status"><Text>Не удалось загрузить информацию о постое. Попробуйте ещё раз.</Text><a className={styles.link} href={detailHref(slug)}>Повторить запрос</a></div>}
    </article>
  </PageContainer></Section>;
}
