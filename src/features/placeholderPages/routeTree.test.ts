import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function pageRoutes(directory: string, route = ""): string[] {
  return readdirSync(directory).flatMap((name) => {
    const absolute = path.join(directory, name);
    if (statSync(absolute).isDirectory()) return pageRoutes(absolute, `${route}/${name}`);
    return name === "page.tsx" ? [route || "/"] : [];
  });
}

/** The seven primary routes plus the static policy target: none of
 * them is a placeholder any more — `/uslugi/zanyatiya`, `/uslugi/progulki`, `/uslugi/postoy` and
 * `/loshadi` were replaced with real SSR content by inlove-dynamic-pages (SC-1..SC-4). */
const MAIN_ROUTES = ["/", "/uslugi/zanyatiya", "/uslugi/progulki", "/uslugi/postoy", "/loshadi", "/novosti", "/about", "/privacy"];

/** The five approved detail route families: `/novosti/[slug]` predates inlove-dynamic-pages,
 * the other four were added by SC-1..SC-4. No other `[slug]`/catch-all route exists, so anything
 * outside these five falls through to Next's default 404. */
const DETAIL_ROUTES = [
  "/novosti/[slug]",
  "/uslugi/zanyatiya/[slug]",
  "/uslugi/progulki/[slug]",
  "/uslugi/postoy/[slug]",
  "/loshadi/[slug]",
];

describe("UT-SC-11 route boundary", () => {
  const appDirectory = path.resolve(process.cwd(), "src/app");
  const source = (route: string) => readFileSync(path.join(appDirectory, route, "page.tsx"), "utf8");

  it("serves the primary pages, static policy target, and only the five approved slug detail routes", () => {
    expect(pageRoutes(appDirectory).sort()).toEqual([...MAIN_ROUTES, ...DETAIL_ROUTES].sort());
    // With no catch-all route/rewrite, unknown paths are handled by Next's 404.
    expect(pageRoutes(appDirectory).filter((route) => route.includes("[")).sort()).toEqual([...DETAIL_ROUTES].sort());
  });

  it.each(["", "about", "novosti", "uslugi/zanyatiya", "uslugi/progulki", "uslugi/postoy", "loshadi"])(
    "replaces the %s placeholder with server content",
    (route) => {
      expect(source(route)).not.toContain("UnderConstructionPage");
      expect(source(route)).not.toContain('"use client"');
    },
  );

  it.each(["novosti/[slug]", "uslugi/zanyatiya/[slug]", "uslugi/progulki/[slug]", "uslugi/postoy/[slug]", "loshadi/[slug]"])(
    "serves the %s detail route with server content",
    (route) => {
      expect(source(route)).not.toContain("UnderConstructionPage");
      expect(source(route)).not.toContain('"use client"');
    },
  );

  it("keeps all routes under the common chrome", () => {
    const layout = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
    expect(layout).toContain("<SiteChrome settings={settings}>{children}</SiteChrome>");
  });
});
