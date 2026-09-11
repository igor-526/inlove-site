import type { Metadata } from "next";
import { z } from "zod";
import { EditorialSplitSection, IntroSection } from "@/ui/sections";
import { PageContainer, Section, Text } from "@/ui/foundations";
import { InlineNotice } from "@/ui/feedback";
import { settingObject, settingText } from "../services/loaders";
import type { loadBoardingData } from "../services/boardingLoaders";
import { BoardingPrices } from "./BoardingPrices";
import { BoardingCta } from "./BoardingCta";
import styles from "./boarding.module.css";

type BoardingData = Awaited<ReturnType<typeof loadBoardingData>>;

function stringItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

const text = z.string().trim().min(1);
const feature = z.object({ label: text, value: z.union([text, z.boolean(), z.number()]), approved: z.boolean().optional(), status: text.optional() });
function entries<T>(value: unknown, schema: z.ZodType<T>): T[] {
  return Array.isArray(value) ? value.flatMap((item) => { const parsed = schema.safeParse(item); return parsed.success ? [parsed.data] : []; }) : [];
}
// Approval is explicit; imported/reported seed statuses (e.g. Yandex Maps features) do not
// authorize publication, per scheme.md "Спорные about.features публикуются только после
// редакционной проверки" — this component only renders what was already approved upstream.
const approved = (item: { approved?: boolean; status?: string }) => item.approved === true || item.status === "approved";

export function boardingMetadata(state: BoardingData["settings"]): Metadata {
  const items = state.status === "success" ? state.data : [];
  const shortName = settingText(items, "site.short_name");
  return {
    title: settingText(items, "seo.boarding.title")
      ?? (shortName ? `${shortName} | Постой` : "Инлав | Постой"),
    description: settingText(items, "seo.boarding.description")
      ?? "Постой частных лошадей в конном клубе «Инлав»: инфраструктура, условия и стоимость.",
    alternates: { canonical: "/uslugi/postoy" },
  };
}

export function BoardingContent({ data }: { data: BoardingData }) {
  const settings = data.settings.status === "success" ? data.settings.data : [];
  const prices = data.prices.status === "success" ? data.prices.data : [];
  const mainPhoto = (index: number) => {
    const item = prices[index] ?? prices[0];
    const url = item?.photos.find((photo) => photo.is_main)?.url ?? item?.photos[0]?.url;
    return url ? { src: url, alt: item?.name } : undefined;
  };
  const included = stringItems(settingObject(settings, "services.boarding.included"));
  const requirements = stringItems(settingObject(settings, "services.boarding.requirements"));
  const features = entries(settingObject(settings, "about.features"), feature).filter(approved)
    .map((item) => item.value === true ? item.label : `${item.label}: ${item.value}`);
  const notice = settingText(settings, "services.notice");
  return <>
    <IntroSection headingLevel={1} eyebrow="Услуги" title="Постой" body={settingText(settings, "services.boarding.intro")} image={mainPhoto(0)} />
    {settingText(settings, "about.setting") ? <EditorialSplitSection title="Инфраструктура" body={settingText(settings, "about.setting")} image={mainPhoto(1)} imageSide="right" /> : null}
    {included.length ? <Section headingId="boarding-included-heading"><PageContainer>
      <Text as="h2" id="boarding-included-heading" variant="h2">Что входит</Text>
      <ul className={styles.list}>{included.map((item) => <li key={item}><Text as="span">{item}</Text></li>)}</ul>
    </PageContainer></Section> : null}
    <BoardingPrices prices={data.prices} />
    {requirements.length || features.length ? <Section headingId="boarding-requirements-heading"><PageContainer>
      <Text as="h2" id="boarding-requirements-heading" variant="h2">Требования и знакомство с клубом</Text>
      <div className={styles.groups}>
        {requirements.length ? <div><Text as="h3" variant="h4">Требования</Text><ul className={styles.list}>{requirements.map((item) => <li key={item}><Text as="span">{item}</Text></li>)}</ul></div> : null}
        {features.length ? <div><Text as="h3" variant="h4">Знакомство с клубом</Text><ul className={styles.list}>{features.map((item) => <li key={item}><Text as="span">{item}</Text></li>)}</ul></div> : null}
      </div>
    </PageContainer></Section> : null}
    {notice?.trim() ? <Section><PageContainer><InlineNotice message={notice} /></PageContainer></Section> : null}
    <BoardingCta label={settingText(settings, "services.boarding.cta_label") ?? "Записаться на постой"} />
  </>;
}
