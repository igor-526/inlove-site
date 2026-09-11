import type { Metadata } from "next";
import { IntroSection } from "@/ui/sections";
import { SITE_CONSUMER_CONFIG } from "@/features/siteSettings";
import type { loadHorsesData } from "./loaders";
import { HorsesGrid } from "./HorsesGrid";
import { HorsesCta } from "./HorsesCta";

type HorsesData = Awaited<ReturnType<typeof loadHorsesData>>;

export function horsesMetadata(): Metadata {
  return {
    title: SITE_CONSUMER_CONFIG.seo.horsesTitle,
    description: SITE_CONSUMER_CONFIG.seo.horsesDescription,
    alternates: { canonical: "/loshadi" },
  };
}

export function HorsesContent({ data }: { data: HorsesData }) {
  return <>
    <IntroSection headingLevel={1} title="Наши лошади" />
    <HorsesGrid
      horses={data.horses}
      emptyText={SITE_CONSUMER_CONFIG.horses.emptyText}
      ctaLabel={SITE_CONSUMER_CONFIG.horses.ctaLabel}
    />
    <HorsesCta label={SITE_CONSUMER_CONFIG.horses.ctaLabel} />
  </>;
}
