import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { loadContentSettings, loadNewsArchive, normalizeNewsPage, settingText } from "@/features/contentPages/services/loaders";
import { NewsArchive, archiveHref } from "@/features/contentPages/newsArchive/NewsArchive";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ page?: string | string[] }> };

async function readPage({ searchParams }: Props) {
  const normalized = normalizeNewsPage((await searchParams).page);
  if (normalized.redirect) redirect("/novosti");
  const [state, settings] = await Promise.all([loadNewsArchive(normalized.page), loadContentSettings()]);
  if (state.status === "not-found") notFound();
  return { page: normalized.page, state, settings: settings.status === "success" ? settings.data : [] };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { page, state, settings } = await readPage(props);
  const title = settingText(settings, "seo.news.title") ?? "Инлав | Новости";
  return {
    title: page === 1 ? title : `${title} — страница ${page}`,
    description: settingText(settings, "seo.news.description") ?? settingText(settings, "seo.default_description") ?? "Новости и жизнь конного клуба «Инлав».",
    alternates: { canonical: archiveHref(page) },
    ...(state.status === "error" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function NewsPage(props: Props) {
  const { page, state, settings } = await readPage(props);
  return <NewsArchive state={state} page={page}
    intro={settingText(settings, "news.intro")}
    emptyText={settingText(settings, "news.empty_text") ?? "Новостей пока нет"}
    nextLabel={settingText(settings, "news.load_more_label") ?? "Следующая страница"}
    timezone={settingText(settings, "site.timezone") ?? "Europe/Moscow"} />;
}
