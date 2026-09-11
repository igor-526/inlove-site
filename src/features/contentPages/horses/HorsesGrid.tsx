"use client";

import { useState } from "react";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { EmptyState, ErrorBlock } from "@/ui/feedback";
import { Button } from "@/ui/controls";
import { HorseCard, type HorseSummary } from "@/ui/cards";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import { SEX_LABELS, formatAge, mainPhotoUrl, type HorseCardDto, type loadHorsesData } from "./loaders";
import styles from "./horses.module.css";

type HorsesState = Awaited<ReturnType<typeof loadHorsesData>>["horses"];

export const horseDetailHref = (slug: string) => `/loshadi/${encodeURIComponent(slug)}`;

function toSummary(horse: HorseCardDto): HorseSummary {
  return {
    name: horse.name,
    pedigree_name: horse.pedigree_name ?? undefined,
    description: horse.description ?? undefined,
    breed: horse.breed?.name,
    coat_color: horse.coat_color?.name,
    height: horse.height ?? undefined,
    sex: SEX_LABELS[horse.sex],
    bdate_formatted: horse.bdate_formatted ?? undefined,
    age: formatAge(horse.age),
    photo: { src: mainPhotoUrl(horse.photos), alt: horse.name },
    services: horse.services.map((service) => service.name),
  };
}

function requestHorse(name?: string, slug?: string) {
  window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, {
    detail: { route: "/loshadi", serviceName: name, serviceSlug: slug },
  }));
}

export function HorsesGrid({ horses, emptyText, ctaLabel }: { horses: HorsesState; emptyText: string; ctaLabel: string }) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (slug: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    return next;
  });
  return <Section headingId="horses-grid-heading"><PageContainer>
    <div className={styles.heading}>
      <Text as="h2" id="horses-grid-heading" variant="h2">Лошади клуба</Text>
    </div>
    {horses.status === "error"
      ? <ErrorBlock message="Не удалось загрузить лошадей." onRetry={() => window.location.reload()} />
      : horses.status === "empty" || !horses.data.length
        ? <EmptyState title={emptyText} action={<Button onClick={() => requestHorse()}>{ctaLabel}</Button>} />
        : <div className={styles.grid}>{horses.data.map((horse) => (
            <HorseCard
              key={horse.slug}
              horse={toSummary(horse)}
              expanded={expanded.has(horse.slug)}
              detailHref={horseDetailHref(horse.slug)}
              onToggle={() => toggle(horse.slug)}
              onRequest={() => requestHorse(horse.name, horse.slug)}
            />
          ))}</div>}
  </PageContainer></Section>;
}
