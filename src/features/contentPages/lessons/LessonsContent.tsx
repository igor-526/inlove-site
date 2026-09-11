import type { Metadata } from "next";
import { BenefitsSection, IntroSection, type BenefitItem } from "@/ui/sections";
import { settingObject, settingText } from "../services/loaders";
import type { loadLessonsData } from "../services/lessonsLoaders";
import { LessonsPrices } from "./LessonsPrices";
import { LessonsCta } from "./LessonsCta";

type LessonsData = Awaited<ReturnType<typeof loadLessonsData>>;

function benefits(value: unknown): BenefitItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => item && typeof item.title === "string" && item.title.trim()
    ? [{ title: item.title.trim(), text: typeof item.text === "string" ? item.text : undefined }] : []);
}

export function lessonsMetadata(state: LessonsData["settings"]): Metadata {
  const items = state.status === "success" ? state.data : [];
  const shortName = settingText(items, "site.short_name");
  return {
    title: settingText(items, "seo.lessons.title")
      ?? (shortName ? `${shortName} | Занятия и абонементы` : "Инлав | Занятия и абонементы"),
    description: settingText(items, "seo.lessons.description")
      ?? "Разовые занятия и абонементы конного клуба «Инлав»: индивидуальные и групповые тренировки.",
    alternates: { canonical: "/uslugi/zanyatiya" },
  };
}

export function LessonsContent({ data }: { data: LessonsData }) {
  const settings = data.settings.status === "success" ? data.settings.data : [];
  return <>
    <IntroSection headingLevel={1} title="Занятия и абонементы" body={settingText(settings, "services.lessons.intro")} />
    <LessonsPrices prices={data.prices} notice={settingText(settings, "services.notice")} />
    <BenefitsSection title="Почему выбирают наши программы" items={benefits(settingObject(settings, "home.program_benefits"))} />
    <LessonsCta label={settingText(settings, "services.lessons.cta_label") ?? "Записаться на занятие"} />
  </>;
}
