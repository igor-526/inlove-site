import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadBoardingDetail } from "@/features/contentPages/services/boardingLoaders";
import { BoardingDetail, detailHref } from "@/features/contentPages/boarding/BoardingDetail";
import { contentPlainText } from "@/lib/content/sanitize";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function readDetail(props: Props) {
  const { slug } = await props.params;
  const state = await loadBoardingDetail(slug);
  if (state.status === "not-found") notFound();
  return { slug, state };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, state } = await readDetail(props);
  if (state.status !== "success") return {
    title: "Постой временно недоступен | Инлав",
    robots: { index: false, follow: true },
    alternates: { canonical: detailHref(slug) },
  };
  return {
    title: `${contentPlainText(state.data.name)} | Инлав`,
    description: state.data.description?.trim() ? contentPlainText(state.data.description).slice(0, 200) : undefined,
    alternates: { canonical: detailHref(state.data.slug) },
  };
}

export default async function BoardingDetailPage(props: Props) {
  const { slug, state } = await readDetail(props);
  return <BoardingDetail state={state} slug={slug} />;
}
