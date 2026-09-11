import type { Metadata } from "next";
import { BenefitsSection, IntroSection } from "@/ui/sections";
import type { loadLessonsData } from "../services/lessonsLoaders";
import { LessonsPrices } from "./LessonsPrices";
import { LessonsCta } from "./LessonsCta";

type LessonsData = Awaited<ReturnType<typeof loadLessonsData>>;

const PROGRAM_BENEFITS = [
  { title: "Бережный подход", text: "Формат занятия подбирается под опыт и цели всадника." },
  { title: "Последовательное обучение", text: "От знакомства с лошадью к уверенной самостоятельной работе." },
];

export function lessonsMetadata(input: LessonsData | LessonsData["settings"]): Metadata {
  const group = "group" in input ? input.group : { status: "empty" as const };
  const description = group.status === "success" && group.data.description.trim()
    ? group.data.description.trim() : "Разовые занятия и абонементы конного клуба «Инлав»: индивидуальные и групповые тренировки.";
  return {
    title: "Инлав | Занятия и абонементы",
    description,
    alternates: { canonical: "/uslugi/zanyatiya" },
  };
}

export function LessonsContent({ data }: { data: LessonsData }) {
  const body = data.group.status === "success" ? data.group.data.description : undefined;
  const prices = data.group.status === "success" ? data.prices : { status: "empty" as const };
  return <>
    <IntroSection headingLevel={1} title="Занятия и абонементы" body={body} />
    {data.group.status === "error" ? <p role="alert">Не удалось загрузить описание услуги.</p> : null}
    {data.group.status === "empty" ? <p role="status">Услуга «Занятия» временно недоступна.</p> : null}
    <LessonsPrices prices={prices} />
    <BenefitsSection title="Почему выбирают наши программы" items={PROGRAM_BENEFITS} />
    <LessonsCta label="Записаться на занятие" />
  </>;
}
