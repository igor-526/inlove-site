import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadHorseDetail } from "@/features/contentPages/horses/loaders";
import { HorseDetail, detailHref } from "@/features/contentPages/horses/HorseDetail";
import { contentPlainText } from "@/lib/content/sanitize";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function readDetail(props: Props) {
  const { slug } = await props.params;
  const state = await loadHorseDetail(slug);
  if (state.status === "not-found") notFound();
  return { slug, state };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, state } = await readDetail(props);
  if (state.status !== "success") return {
    title: "Лошадь временно недоступна | Инлав",
    robots: { index: false, follow: true },
    alternates: { canonical: detailHref(slug) },
  };
  return {
    title: `${contentPlainText(state.data.name)} | Инлав`,
    description: state.data.description?.trim() ? contentPlainText(state.data.description).slice(0, 200) : undefined,
    alternates: { canonical: detailHref(state.data.slug) },
  };
}

export default async function HorseDetailPage(props: Props) {
  const { slug, state } = await readDetail(props);
  return <HorseDetail state={state} slug={slug} />;
}
