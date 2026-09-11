import type { Metadata } from "next";
import { EditorialSplitSection, IntroSection } from "@/ui/sections";
import { PageContainer, Section, Text } from "@/ui/foundations";
import type { loadBoardingData } from "../services/boardingLoaders";
import { BoardingPrices } from "./BoardingPrices";
import { BoardingCta } from "./BoardingCta";
import styles from "./boarding.module.css";

type BoardingData = Awaited<ReturnType<typeof loadBoardingData>>;

export function boardingMetadata(input: BoardingData | BoardingData["settings"]): Metadata {
  const group = "group" in input ? input.group : { status: "empty" as const };
  return {
    title: "Инлав | Постой",
    description: group.status === "success" && group.data.description.trim()
      ? group.data.description.trim() : "Постой частных лошадей в конном клубе «Инлав»: инфраструктура, условия и стоимость.",
    alternates: { canonical: "/uslugi/postoy" },
  };
}

export function BoardingContent({ data }: { data: BoardingData }) {
  const prices = data.prices.status === "success" ? data.prices.data : [];
  const mainPhoto = (index: number) => {
    const item = prices[index] ?? prices[0];
    const url = item?.photos.find((photo) => photo.is_main)?.url ?? item?.photos[0]?.url;
    return url ? { src: url, alt: item?.name } : undefined;
  };
  const included = ["Безопасное размещение", "Ежедневный уход", "Доступ к инфраструктуре клуба"];
  const requirements = ["Условия размещения и наличие мест подтверждаются сотрудником клуба."];
  const visiblePrices = data.group.status === "success" ? data.prices : { status: "empty" as const };
  return <>
    <IntroSection headingLevel={1} eyebrow="Услуги" title="Постой" body={data.group.status === "success" ? data.group.data.description : undefined} image={mainPhoto(0)} />
    {data.group.status === "error" ? <p role="alert">Не удалось загрузить описание услуги.</p> : null}
    {data.group.status === "empty" ? <p role="status">Услуга «Постой» временно недоступна.</p> : null}
    <EditorialSplitSection title="Инфраструктура" body="Условия постоя обсуждаются индивидуально после знакомства с клубом." image={mainPhoto(1)} imageSide="right" />
    {included.length ? <Section headingId="boarding-included-heading"><PageContainer>
      <Text as="h2" id="boarding-included-heading" variant="h2">Что входит</Text>
      <ul className={styles.list}>{included.map((item) => <li key={item}><Text as="span">{item}</Text></li>)}</ul>
    </PageContainer></Section> : null}
    <BoardingPrices prices={visiblePrices} />
    {requirements.length ? <Section headingId="boarding-requirements-heading"><PageContainer>
      <Text as="h2" id="boarding-requirements-heading" variant="h2">Требования и знакомство с клубом</Text>
      <div className={styles.groups}>
        {requirements.length ? <div><Text as="h3" variant="h4">Требования</Text><ul className={styles.list}>{requirements.map((item) => <li key={item}><Text as="span">{item}</Text></li>)}</ul></div> : null}
      </div>
    </PageContainer></Section> : null}
    <BoardingCta label="Записаться на постой" />
  </>;
}
