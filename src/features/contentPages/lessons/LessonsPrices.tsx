"use client";

import { useMemo, useState } from "react";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { EmptyState, ErrorBlock, InlineNotice } from "@/ui/feedback";
import { Button, SegmentedToggle } from "@/ui/controls";
import { TariffCard, type TariffSummary } from "@/ui/cards";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import { LESSON_CATEGORY, type LessonCategory, type loadLessonsData } from "../services/lessonsLoaders";
import { detailHref } from "./LessonsDetail";
import styles from "./lessons.module.css";

type PricesState = Awaited<ReturnType<typeof loadLessonsData>>["prices"];

function requestLesson(name?: string, slug?: string) {
  window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, {
    detail: { route: "/uslugi/zanyatiya", serviceName: name, serviceSlug: slug },
  }));
}

const CATEGORY_OPTIONS: { value: LessonCategory; label: string }[] = [
  { value: "single", label: "Разовые" },
  { value: "subscription", label: "Абонементы" },
];

export function LessonsPrices({ prices, notice }: { prices: PricesState; notice?: string }) {
  const [category, setCategory] = useState<LessonCategory>("single");
  const items: TariffSummary[] = useMemo(() => prices.status === "success" ? prices.data
    .filter((item) => LESSON_CATEGORY[item.slug] === category)
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? undefined,
      photo: { src: item.photos.find((photo) => photo.is_main)?.url ?? item.photos[0]?.url },
      tables: item.price_tables,
    })) : [], [prices, category]);
  return <Section tone="sage" headingId="lessons-prices-heading"><PageContainer>
    <div className={styles.heading}>
      <Text as="h2" id="lessons-prices-heading" variant="h2">Стоимость</Text>
      <SegmentedToggle ariaLabel="Тип занятий" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
    </div>
    {prices.status === "error" ? <ErrorBlock message="Не удалось загрузить стоимость." onRetry={() => window.location.reload()} />
      : prices.status === "empty" || !items.length ? <EmptyState title="Стоимость уточняется" message="Оставьте заявку — мы подберём подходящий вариант." action={<Button onClick={() => requestLesson()}>Уточнить стоимость</Button>} />
      : <div className={styles.grid}>{items.map((item) => <TariffCard key={item.slug} tariff={item} detailHref={detailHref(item.slug)} onRequest={() => requestLesson(item.name, item.slug)} />)}</div>}
    {notice?.trim() ? <InlineNotice message={notice} /> : null}
  </PageContainer></Section>;
}
