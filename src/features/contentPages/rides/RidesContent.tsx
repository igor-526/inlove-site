import type { Metadata } from "next";
import { EditorialSplitSection, IntroSection, PreparationSafetySection, type InformationBlock } from "@/ui/sections";
import { settingObject, settingText } from "../services/loaders";
import type { loadRidesData } from "../services/ridesLoaders";
import { RidesPrices } from "./RidesPrices";
import { RidesCta } from "./RidesCta";

type RidesData = Awaited<ReturnType<typeof loadRidesData>>;

function stringItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

export function ridesMetadata(state: RidesData["settings"]): Metadata {
  const items = state.status === "success" ? state.data : [];
  const shortName = settingText(items, "site.short_name");
  return {
    title: settingText(items, "seo.rides.title")
      ?? (shortName ? `${shortName} | Прогулки` : "Инлав | Прогулки"),
    description: settingText(items, "seo.rides.description")
      ?? "Конные прогулки конного клуба «Инлав»: варианты, подготовка и стоимость.",
    alternates: { canonical: "/uslugi/progulki" },
  };
}

export function RidesContent({ data }: { data: RidesData }) {
  const settings = data.settings.status === "success" ? data.settings.data : [];
  const prices = data.prices.status === "success" ? data.prices.data : [];
  const mainPhoto = (index: number) => {
    const item = prices[index] ?? prices[0];
    const url = item?.photos.find((photo) => photo.is_main)?.url ?? item?.photos[0]?.url;
    return url ? { src: url, alt: item?.name } : undefined;
  };
  const preparation: InformationBlock = { title: "Подготовка", items: stringItems(settingObject(settings, "services.rides.preparation")) };
  const safety: InformationBlock = { title: "Безопасность", items: stringItems(settingObject(settings, "services.rides.safety")) };
  return <>
    <IntroSection headingLevel={1} eyebrow="Услуги" title="Прогулки" />
    <EditorialSplitSection title="Как проходит прогулка" body={settingText(settings, "services.rides.intro")} image={mainPhoto(0)} imageSide="right" />
    <RidesPrices prices={data.prices} notice={settingText(settings, "services.notice")} />
    {settingText(settings, "about.setting") ? <EditorialSplitSection title="Окружение" body={settingText(settings, "about.setting")} image={mainPhoto(1)} imageSide="left" /> : null}
    <PreparationSafetySection blocks={[preparation, safety]} />
    <RidesCta label={settingText(settings, "services.rides.cta_label") ?? "Записаться на прогулку"} />
  </>;
}
