import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { loadNewsArchive, normalizeNewsPage } from "@/features/contentPages/services/loaders";
import { SITE_CONSUMER_CONFIG } from "@/features/siteSettings";
import { NewsArchive, archiveHref } from "@/features/contentPages/newsArchive/NewsArchive";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ page?: string | string[] }> };

async function readPage({ searchParams }: Props) {
  const normalized = normalizeNewsPage((await searchParams).page);
  if (normalized.redirect) redirect("/novosti");
  const state = await loadNewsArchive(normalized.page);
  if (state.status === "not-found") notFound();
  return { page: normalized.page, state };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { page, state } = await readPage(props);
  const title = SITE_CONSUMER_CONFIG.seo.newsTitle;
  return {
    title: page === 1 ? title : `${title} — страница ${page}`,
    description: SITE_CONSUMER_CONFIG.seo.newsDescription,
    alternates: { canonical: archiveHref(page) },
    ...(state.status === "error" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function NewsPage(props: Props) {
  const { page, state } = await readPage(props);
  return <NewsArchive state={state} page={page}
    emptyText={SITE_CONSUMER_CONFIG.news.emptyText}
    nextLabel={SITE_CONSUMER_CONFIG.news.nextLabel}
    timezone={SITE_CONSUMER_CONFIG.news.timezone} />;
}
