import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import Page, { dynamic, generateMetadata } from "@/app/uslugi/zanyatiya/[slug]/page";
import { loadLessonsDetail } from "../services/lessonsLoaders";
import type { PriceOutWithTablesDto } from "@/types/prices";

vi.mock("../services/lessonsLoaders", async (original) => ({
  ...await original<typeof import("../services/lessonsLoaders")>(),
  loadLessonsDetail: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("route-404"); } }));

const props = () => ({ params: Promise.resolve({ slug: "individual-lesson-official" }) });
const tariff = {
  id: "1", slug: "individual-lesson-official", name: "Индивидуальное занятие", description: "Работа с тренером один на один.",
  photos: [{ id: "00000000-0000-4000-8000-000000000001", is_main: true, url: "/photo.jpg" }],
  groups: [], created_at: "2026-01-01T00:00:00Z", updated_at: null,
  price_tables: [{
    columns: [
      { key: "duration", title: "Длительность", annotation: "", cell_formatter: [] },
      { key: "price", title: "Цена", annotation: "", cell_formatter: ["text_bold"] },
    ],
    rows: [{ cells: {
      duration: { value: "60 минут", annotation: "", cell_formatter: [] },
      price: { value: "1500 ₽", annotation: "", cell_formatter: ["text_bold"] },
    } }],
  }],
} as unknown as PriceOutWithTablesDto;

beforeEach(() => { vi.mocked(loadLessonsDetail).mockReset(); });

describe("UT-LESSONS-DETAIL direct server entry", () => {
  it("renders one h1, photo, description and the tariff table with column headers and cells", async () => {
    expect(dynamic).toBe("force-dynamic");
    vi.mocked(loadLessonsDetail).mockResolvedValue({ status: "success", data: tariff });
    const html = renderToStaticMarkup(await Page(props()));
    expect(loadLessonsDetail).toHaveBeenCalledWith("individual-lesson-official");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Индивидуальное занятие");
    expect(html).toContain("Работа с тренером один на один.");
    expect(html).toContain("src=\"/photo.jpg\"");
    expect(html).toContain("Длительность");
    expect(html).toContain("60 минут");
    expect(html).toContain("1500 ₽");
    expect(html).toContain('href="/uslugi/zanyatiya"');
  });

  it("uses tariff name/description for metadata and its own slug canonical", async () => {
    vi.mocked(loadLessonsDetail).mockResolvedValue({ status: "success", data: tariff });
    expect(await generateMetadata(props())).toMatchObject({
      title: "Индивидуальное занятие | Инлав",
      description: "Работа с тренером один на один.",
      alternates: { canonical: "/uslugi/zanyatiya/individual-lesson-official" },
    });
  });
});

describe("UT-LESSONS-DETAIL allow-list and data failures", () => {
  it("raises route 404 for a slug outside this page's allow-list (loader returns not-found)", async () => {
    vi.mocked(loadLessonsDetail).mockResolvedValue({ status: "not-found" });
    await expect(Page(props())).rejects.toThrow("route-404");
    await expect(generateMetadata(props())).rejects.toThrow("route-404");
  });

  it.each([401, 500, 503, undefined])("keeps %s failure separate from 404 and marks noindex", async (statusCode) => {
    vi.mocked(loadLessonsDetail).mockResolvedValue({ status: "error", statusCode });
    const html = renderToStaticMarkup(await Page(props()));
    expect(html).toContain("Не удалось загрузить тариф");
    expect(html).not.toContain(tariff.name);
    expect(await generateMetadata(props())).toMatchObject({ robots: { index: false, follow: true } });
  });
});

describe("UT-LESSONS-DETAIL mobile table layout", () => {
  it("stacks the tariff table into label/value pairs under 767px", () => {
    const css = readFileSync(new URL("../../../ui/cards/cards.module.css", import.meta.url), "utf8");
    expect(css).toMatch(/@media\(max-width:767px\)\{[\s\S]*?\.tariffTable,\.tariffTable tbody,\.tariffTable tr,\.tariffTable td\{display:block/);
    expect(css).toMatch(/\.cellLabel\{display:inline\}/);
  });
});
