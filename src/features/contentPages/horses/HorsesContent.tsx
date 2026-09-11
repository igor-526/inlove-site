import type { Metadata } from "next";
import { IntroSection } from "@/ui/sections";
import { settingText } from "../services/loaders";
import type { loadHorsesData } from "./loaders";
import { HorsesGrid } from "./HorsesGrid";
import { HorsesCta } from "./HorsesCta";

type HorsesData = Awaited<ReturnType<typeof loadHorsesData>>;

const EMPTY_TEXT_FALLBACK = "Скоро познакомим вас с лошадьми клуба";

export function horsesMetadata(state: HorsesData["settings"]): Metadata {
  const items = state.status === "success" ? state.data : [];
  const shortName = settingText(items, "site.short_name");
  return {
    title: settingText(items, "seo.horses.title")
      ?? (shortName ? `${shortName} | Лошади` : "Инлав | Лошади"),
    description: settingText(items, "seo.horses.description")
      ?? "Лошади конного клуба «Инлав»: породы, характер и услуги, доступные с каждой лошадью.",
    alternates: { canonical: "/loshadi" },
  };
}

export function HorsesContent({ data }: { data: HorsesData }) {
  const settings = data.settings.status === "success" ? data.settings.data : [];
  return <>
    <IntroSection headingLevel={1} title="Наши лошади" body={settingText(settings, "horses.intro")} />
    <HorsesGrid
      horses={data.horses}
      emptyText={settingText(settings, "horses.empty_text") ?? EMPTY_TEXT_FALLBACK}
      ctaLabel={settingText(settings, "horses.cta_label") ?? "Записаться в клуб"}
    />
    <HorsesCta label={settingText(settings, "horses.cta_label") ?? "Записаться в клуб"} />
  </>;
}
