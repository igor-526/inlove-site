import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadLessonsDetail } from "@/features/contentPages/services/lessonsLoaders";
import { LessonsDetail, detailHref } from "@/features/contentPages/lessons/LessonsDetail";
import { contentPlainText } from "@/lib/content/sanitize";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function readDetail(props: Props) {
  const { slug } = await props.params;
  const state = await loadLessonsDetail(slug);
  if (state.status === "not-found") notFound();
  return { slug, state };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, state } = await readDetail(props);
  if (state.status !== "success") return {
    title: "Тариф временно недоступен | Инлав",
    robots: { index: false, follow: true },
    alternates: { canonical: detailHref(slug) },
  };
  return {
    title: `${contentPlainText(state.data.name)} | Инлав`,
    description: state.data.description?.trim() ? contentPlainText(state.data.description).slice(0, 200) : undefined,
    alternates: { canonical: detailHref(state.data.slug) },
  };
}

export default async function LessonsDetailPage(props: Props) {
  const { slug, state } = await readDetail(props);
  return <LessonsDetail state={state} slug={slug} />;
}
