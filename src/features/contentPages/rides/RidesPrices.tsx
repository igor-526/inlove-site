"use client";

import { useMemo } from "react";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { EmptyState, ErrorBlock, InlineNotice } from "@/ui/feedback";
import { Button } from "@/ui/controls";
import { TariffCard, type TariffSummary } from "@/ui/cards";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import type { loadRidesData } from "../services/ridesLoaders";
import { detailHref } from "./RidesDetail";
import styles from "./rides.module.css";

type PricesState = Awaited<ReturnType<typeof loadRidesData>>["prices"];

function requestRide(name?: string, slug?: string) {
  window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, {
    detail: { route: "/uslugi/progulki", serviceName: name, serviceSlug: slug },
  }));
}

export function RidesPrices({ prices, notice }: { prices: PricesState; notice?: string }) {
  // Two conflicting offers (horse-rides-official / horse-ride-yandex) are shown separately with
  // their own CMS name, never merged into one card, per scheme.md "Услуги / Прогулки".
  const items: TariffSummary[] = useMemo(() => prices.status === "success" ? prices.data.map((item) => ({
    name: item.name,
    slug: item.slug,
    description: item.description ?? undefined,
    photo: { src: item.photos.find((photo) => photo.is_main)?.url ?? item.photos[0]?.url },
    tables: item.price_tables,
  })) : [], [prices]);
  return <Section tone="sage" headingId="rides-prices-heading"><PageContainer>
    <Text as="h2" id="rides-prices-heading" variant="h2">Варианты и цены</Text>
    {prices.status === "error" ? <ErrorBlock message="Не удалось загрузить стоимость." onRetry={() => window.location.reload()} />
      : prices.status === "empty" || !items.length ? <EmptyState title="Стоимость уточняется" message="Оставьте заявку — мы уточним варианты прогулки." action={<Button onClick={() => requestRide()}>Уточнить стоимость</Button>} />
      : <div className={styles.grid}>{items.map((item) => <TariffCard key={item.slug} tariff={item} ctaLabel="Записаться на прогулку" detailHref={detailHref(item.slug)} onRequest={() => requestRide(item.name, item.slug)} />)}</div>}
    {notice?.trim() ? <InlineNotice message={notice} /> : null}
  </PageContainer></Section>;
}
