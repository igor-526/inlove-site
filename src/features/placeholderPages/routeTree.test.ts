import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PLACEHOLDER_ROUTES } from "./metadata";

function pageRoutes(directory: string, route = ""): string[] {
  return readdirSync(directory).flatMap((name) => {
    const absolute = path.join(directory, name);
    if (statSync(absolute).isDirectory()) return pageRoutes(absolute, `${route}/${name}`);
    return name === "page.tsx" ? [route || "/"] : [];
  });
}

describe("UT-SC-11 route boundary", () => {
  const appDirectory = path.resolve(process.cwd(), "src/app");
  const source = (route: string) => readFileSync(path.join(appDirectory, route, "page.tsx"), "utf8");

  it("serves seven main pages plus only the approved news slug detail", () => {
    expect(pageRoutes(appDirectory).sort()).toEqual([
      ...Object.values(PLACEHOLDER_ROUTES).map(({ path: route }) => route),
      "/novosti/[slug]",
    ].sort());
    // With no catch-all route/rewrite, unknown paths are handled by Next's 404.
    expect(pageRoutes(appDirectory).filter((route) => route.includes("["))).toEqual(["/novosti/[slug]"]);
  });

  it.each(["", "about", "novosti"])("replaces the %s placeholder with server content", (route) => {
    expect(source(route)).not.toContain("UnderConstructionPage");
    expect(source(route)).not.toContain('"use client"');
  });

  it.each(["uslugi/zanyatiya", "uslugi/progulki", "uslugi/postoy", "loshadi"])("retains the %s placeholder", (route) => {
    expect(source(route)).toContain("UnderConstructionPage");
  });

  it("keeps all routes under the common chrome", () => {
    const layout = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
    expect(layout).toContain("<SiteChrome settings={settings}>{children}</SiteChrome>");
  });
});
