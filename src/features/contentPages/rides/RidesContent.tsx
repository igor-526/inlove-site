import type { Metadata } from "next";
import { EditorialSplitSection, IntroSection, PreparationSafetySection, type InformationBlock } from "@/ui/sections";
import type { loadRidesData } from "../services/ridesLoaders";
import { RidesPrices } from "./RidesPrices";
import { RidesCta } from "./RidesCta";

type RidesData = Awaited<ReturnType<typeof loadRidesData>>;

export function ridesMetadata(input: RidesData | RidesData["settings"]): Metadata {
  const group = "group" in input ? input.group : { status: "empty" as const };
  return {
    title: "Инлав | Прогулки",
    description: group.status === "success" && group.data.description.trim()
      ? group.data.description.trim() : "Конные прогулки конного клуба «Инлав»: варианты, подготовка и стоимость.",
    alternates: { canonical: "/uslugi/progulki" },
  };
}

export function RidesContent({ data }: { data: RidesData }) {
  const prices = data.prices.status === "success" ? data.prices.data : [];
  const mainPhoto = (index: number) => {
    const item = prices[index] ?? prices[0];
    const url = item?.photos.find((photo) => photo.is_main)?.url ?? item?.photos[0]?.url;
    return url ? { src: url, alt: item?.name } : undefined;
  };
  const preparation: InformationBlock = { title: "Подготовка", items: ["Выбирайте удобную одежду и закрытую обувь."] };
  const safety: InformationBlock = { title: "Безопасность", items: ["Следуйте указаниям инструктора во время всей прогулки."] };
  const visiblePrices = data.group.status === "success" ? data.prices : { status: "empty" as const };
  return <>
    <IntroSection headingLevel={1} eyebrow="Услуги" title="Прогулки" />
    <EditorialSplitSection title="Как проходит прогулка" body={data.group.status === "success" ? data.group.data.description : undefined} image={mainPhoto(0)} imageSide="right" />
    {data.group.status === "error" ? <p role="alert">Не удалось загрузить описание услуги.</p> : null}
    {data.group.status === "empty" ? <p role="status">Услуга «Прогулки» временно недоступна.</p> : null}
    <RidesPrices prices={visiblePrices} />
    <EditorialSplitSection title="Окружение" body="Маршрут проходит в спокойной природной обстановке рядом с клубом." image={mainPhoto(1)} imageSide="left" />
    <PreparationSafetySection blocks={[preparation, safety]} />
    <RidesCta label="Записаться на прогулку" />
  </>;
}
