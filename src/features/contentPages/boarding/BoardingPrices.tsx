"use client";

import { useMemo } from "react";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { EmptyState, ErrorBlock } from "@/ui/feedback";
import { Button } from "@/ui/controls";
import { TariffCard, type TariffSummary } from "@/ui/cards";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import type { loadBoardingData } from "../services/boardingLoaders";
import { detailHref } from "./BoardingDetail";
import styles from "./boarding.module.css";

type PricesState = Awaited<ReturnType<typeof loadBoardingData>>["prices"];

function requestBoarding(name?: string, slug?: string) {
  window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, {
    detail: { route: "/uslugi/postoy", serviceName: name, serviceSlug: slug },
  }));
}

export function BoardingPrices({ prices }: { prices: PricesState }) {
  // A single allow-listed tariff (horse-boarding-yandex): an empty result means the price is
  // unconfirmed, never a free service, per scheme.md "Услуги / Постой".
  const items: TariffSummary[] = useMemo(() => prices.status === "success" ? prices.data.map((item) => ({
    name: item.name,
    slug: item.slug,
    description: item.description ?? undefined,
    photo: { src: item.photos.find((photo) => photo.is_main)?.url ?? item.photos[0]?.url },
    tables: item.price_tables,
  })) : [], [prices]);
  return <Section tone="sage" headingId="boarding-prices-heading"><PageContainer>
    <Text as="h2" id="boarding-prices-heading" variant="h2">Стоимость</Text>
    {prices.status === "error" ? <ErrorBlock message="Не удалось загрузить стоимость." onRetry={() => window.location.reload()} />
      : prices.status === "empty" || !items.length ? <EmptyState title="Стоимость и наличие мест уточняются" message="Оставьте заявку — мы уточним условия постоя." action={<Button onClick={() => requestBoarding()}>Уточнить стоимость</Button>} />
      : <div className={styles.grid}>{items.map((item) => <TariffCard key={item.slug} tariff={item} ctaLabel="Записаться на постой" detailHref={detailHref(item.slug)} onRequest={() => requestBoarding(item.name, item.slug)} />)}</div>}
  </PageContainer></Section>;
}
