import type { Metadata } from "next";

export const PLACEHOLDER_ROUTES = {
  home: { path: "/", heading: "Конный клуб «Инлав»", title: "Инлав", seoKey: "home" },
  news: { path: "/novosti", heading: "Новости клуба", title: "Инлав | Новости", seoKey: "news" },
  about: { path: "/about", heading: "О клубе", title: "Инлав | О клубе", seoKey: "about" },
} as const;

export type PlaceholderRoute = keyof typeof PLACEHOLDER_ROUTES;

const FALLBACK_DESCRIPTION = "Конный клуб «Инлав»: занятия, прогулки, постой лошадей и жизнь клуба.";

export function createRouteMetadata(route: PlaceholderRoute): Metadata {
  const config = PLACEHOLDER_ROUTES[route];
  return { title: config.title, description: FALLBACK_DESCRIPTION, alternates: { canonical: config.path } };
}
