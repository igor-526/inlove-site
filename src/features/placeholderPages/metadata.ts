import type { Metadata } from "next";
import { siteSettingList } from "@/api/siteSettings";

export const PLACEHOLDER_ROUTES = {
  home: { path: "/", heading: "Конный клуб «Инлав»", title: "Инлав", seoKey: "home" },
  news: { path: "/novosti", heading: "Новости клуба", title: "Инлав | Новости", seoKey: "news" },
  about: { path: "/about", heading: "О клубе", title: "Инлав | О клубе", seoKey: "about" },
} as const;

export type PlaceholderRoute = keyof typeof PLACEHOLDER_ROUTES;

const FALLBACK_DESCRIPTION = "Конный клуб «Инлав»: занятия, прогулки, постой лошадей и жизнь клуба.";

export async function createRouteMetadata(route: PlaceholderRoute): Promise<Metadata> {
  const config = PLACEHOLDER_ROUTES[route];
  const titleKey = `seo.${config.seoKey}.title`;
  const descriptionKey = `seo.${config.seoKey}.description`;
  const response = await siteSettingList({
    key: [titleKey, descriptionKey, "seo.default_title", "seo.default_description"],
  });
  const values = new Map(
    response.status === "ok" && Array.isArray(response.data)
      ? response.data.filter((item) => item.type === "string" && item.value.trim()).map((item) => [item.key, item.value.trim()])
      : [],
  );
  const title = values.get(titleKey)
    ?? (route === "home" ? values.get("seo.default_title") : undefined)
    ?? config.title;
  const description = values.get(descriptionKey) ?? values.get("seo.default_description") ?? FALLBACK_DESCRIPTION;

  return { title, description, alternates: { canonical: config.path } };
}
