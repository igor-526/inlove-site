import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadRidesDetail } from "@/features/contentPages/services/ridesLoaders";
import { RidesDetail, detailHref } from "@/features/contentPages/rides/RidesDetail";
import { contentPlainText } from "@/lib/content/sanitize";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function readDetail(props: Props) {
  const { slug } = await props.params;
  const state = await loadRidesDetail(slug);
  if (state.status === "not-found") notFound();
  return { slug, state };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, state } = await readDetail(props);
  if (state.status !== "success") return {
    title: "Прогулка временно недоступна | Инлав",
    robots: { index: false, follow: true },
    alternates: { canonical: detailHref(slug) },
  };
  return {
    title: `${contentPlainText(state.data.name)} | Инлав`,
    description: state.data.description?.trim() ? contentPlainText(state.data.description).slice(0, 200) : undefined,
    alternates: { canonical: detailHref(state.data.slug) },
  };
}

export default async function RidesDetailPage(props: Props) {
  const { slug, state } = await readDetail(props);
  return <RidesDetail state={state} slug={slug} />;
}
