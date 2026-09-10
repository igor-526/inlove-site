import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadNewsDetail, loadContentSettings, settingText } from "@/features/contentPages/services/loaders";
import { NewsDetail, detailHref } from "@/features/contentPages/newsDetail/NewsDetail";
import { contentPlainText } from "@/lib/content/sanitize";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function readDetail(props: Props) {
  const { slug } = await props.params;
  const state = await loadNewsDetail(slug);
  if (state.status === "not-found") notFound();
  return { slug, state };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, state } = await readDetail(props);
  if (state.status !== "success") return {
    title: "Новость временно недоступна | Инлав",
    robots: { index: false, follow: true },
    alternates: { canonical: detailHref(slug) },
  };
  return {
    title: contentPlainText(state.data.name),
    description: contentPlainText(state.data.snippet || state.data.content).slice(0, 200),
    alternates: { canonical: detailHref(state.data.slug) },
  };
}

export default async function NewsDetailPage(props: Props) {
  const [{ slug, state }, settings] = await Promise.all([readDetail(props), loadContentSettings()]);
  const timezone = settings.status === "success" ? settingText(settings.data, "site.timezone") : undefined;
  return <NewsDetail state={state} slug={slug} timezone={timezone ?? "Europe/Moscow"} />;
}
