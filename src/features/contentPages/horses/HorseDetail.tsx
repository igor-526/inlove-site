import Link from "next/link";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { ResponsiveImage } from "@/ui/atoms";
import { FeatureItem } from "@/ui/cards";
import { SEX_LABELS, formatAge, type loadHorseDetail } from "./loaders";
import styles from "./detail.module.css";

export const detailHref = (slug: string) => `/loshadi/${encodeURIComponent(slug)}`;

export function HorseDetail({ state, slug }: {
  state: Awaited<ReturnType<typeof loadHorseDetail>>; slug: string;
}) {
  const horse = state.status === "success" ? state.data : undefined;
  const photos = horse ? [...horse.photos].sort((a, b) => Number(b.is_main) - Number(a.is_main)) : [];
  return <Section spacing="editorial" headingId="horse-detail-title"><PageContainer>
    <article className={styles.article}>
      <Link className={styles.link} href="/loshadi">Все лошади клуба</Link>
      <header>
        <Text as="h1" id="horse-detail-title" variant="display-l">{horse?.name ?? "Лошадь временно недоступна"}</Text>
        {horse?.pedigree_name?.trim() ? <Text variant="body-l" tone="secondary">{horse.pedigree_name}</Text> : null}
      </header>
      {horse ? <>
        {photos.length ? <div className={styles.photos}>{photos.map((photo, index) => <ResponsiveImage key={photo.id} src={photo.url} alt={`${horse.name} — фото ${index + 1}`} ratio="16:10" priority={index === 0} />)}</div> : null}
        <div className={styles.traits}>
          <FeatureItem id="horse-breed" label="Порода" value={horse.breed?.name} />
          <FeatureItem id="horse-coat-color" label="Масть" value={horse.coat_color?.name} />
          <FeatureItem id="horse-height" label="Рост" value={horse.height ? `${horse.height} см` : undefined} />
          <FeatureItem id="horse-sex" label="Пол" value={SEX_LABELS[horse.sex]} />
          <FeatureItem id="horse-bdate" label="Дата рождения" value={horse.bdate_formatted ?? undefined} />
          <FeatureItem id="horse-age" label="Возраст" value={formatAge(horse.age)} />
        </div>
        {horse.description?.trim() ? <Text variant="body-l">{horse.description}</Text> : null}
        {horse.services.length ? <ul>{horse.services.map((service) => <li key={service.id}>{service.name}</li>)}</ul> : null}
      </> : <div role="status"><Text>Не удалось загрузить лошадь. Попробуйте ещё раз.</Text><a className={styles.link} href={detailHref(slug)}>Повторить запрос</a></div>}
    </article>
  </PageContainer></Section>;
}
