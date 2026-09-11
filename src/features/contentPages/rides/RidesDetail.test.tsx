import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page, { dynamic, generateMetadata } from "@/app/uslugi/progulki/[slug]/page";
import { loadRidesDetail } from "../services/ridesLoaders";
import type { PriceOutWithTablesDto } from "@/types/prices";

vi.mock("../services/ridesLoaders", async (original) => ({
  ...await original<typeof import("../services/ridesLoaders")>(),
  loadRidesDetail: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("route-404"); } }));

const props = () => ({ params: Promise.resolve({ slug: "horse-rides-official" }) });
const tariff = {
  id: "1", slug: "horse-rides-official", name: "Конная прогулка", description: "Прогулка в сопровождении инструктора.",
  photos: [{ id: "00000000-0000-4000-8000-000000000001", is_main: true, url: "/ride.jpg" }],
  groups: [], created_at: "2026-01-01T00:00:00Z", updated_at: null,
  price_tables: [{
    columns: [
      { key: "duration", title: "Длительность", annotation: "", cell_formatter: [] },
      { key: "price", title: "Цена", annotation: "", cell_formatter: ["text_bold"] },
    ],
    rows: [{ cells: {
      duration: { value: "40 минут", annotation: "", cell_formatter: [] },
      price: { value: "2000 ₽", annotation: "", cell_formatter: ["text_bold"] },
    } }],
  }],
} as unknown as PriceOutWithTablesDto;

beforeEach(() => { vi.mocked(loadRidesDetail).mockReset(); });

describe("UT-RIDES-DETAIL direct server entry", () => {
  it("renders one h1, photo, description and the tariff table with column headers and cells", async () => {
    expect(dynamic).toBe("force-dynamic");
    vi.mocked(loadRidesDetail).mockResolvedValue({ status: "success", data: tariff });
    const html = renderToStaticMarkup(await Page(props()));
    expect(loadRidesDetail).toHaveBeenCalledWith("horse-rides-official");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Конная прогулка");
    expect(html).toContain("Прогулка в сопровождении инструктора.");
    expect(html).toContain("src=\"/ride.jpg\"");
    expect(html).toContain("Длительность");
    expect(html).toContain("40 минут");
    expect(html).toContain("2000 ₽");
    expect(html).toContain('href="/uslugi/progulki"');
  });

  it("uses tariff name/description for metadata and its own slug canonical", async () => {
    vi.mocked(loadRidesDetail).mockResolvedValue({ status: "success", data: tariff });
    expect(await generateMetadata(props())).toMatchObject({
      title: "Конная прогулка | Инлав",
      description: "Прогулка в сопровождении инструктора.",
      alternates: { canonical: "/uslugi/progulki/horse-rides-official" },
    });
  });
});

describe("UT-RIDES-DETAIL allow-list and data failures", () => {
  it("raises route 404 for a slug outside this page's allow-list (loader returns not-found)", async () => {
    vi.mocked(loadRidesDetail).mockResolvedValue({ status: "not-found" });
    await expect(Page(props())).rejects.toThrow("route-404");
    await expect(generateMetadata(props())).rejects.toThrow("route-404");
  });

  it.each([401, 500, 503, undefined])("keeps %s failure separate from 404 and marks noindex", async (statusCode) => {
    vi.mocked(loadRidesDetail).mockResolvedValue({ status: "error", statusCode });
    const html = renderToStaticMarkup(await Page(props()));
    expect(html).toContain("Не удалось загрузить прогулку");
    expect(html).not.toContain(tariff.name);
    expect(await generateMetadata(props())).toMatchObject({ robots: { index: false, follow: true } });
  });
});
