import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page, { dynamic, generateMetadata } from "@/app/uslugi/postoy/[slug]/page";
import { loadBoardingDetail } from "../services/boardingLoaders";
import type { PriceOutWithTablesDto } from "@/types/prices";

vi.mock("../services/boardingLoaders", async (original) => ({
  ...await original<typeof import("../services/boardingLoaders")>(),
  loadBoardingDetail: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("route-404"); } }));

const props = () => ({ params: Promise.resolve({ slug: "horse-boarding-yandex" }) });
const tariff = {
  id: "1", slug: "horse-boarding-yandex", name: "Постой частных лошадей", description: "Полный пансион для лошади.",
  photos: [{ id: "00000000-0000-4000-8000-000000000001", is_main: true, url: "/boarding.jpg" }],
  groups: [], created_at: "2026-01-01T00:00:00Z", updated_at: null,
  price_tables: [{
    columns: [
      { key: "period", title: "Период", annotation: "", cell_formatter: [] },
      { key: "price", title: "Цена", annotation: "", cell_formatter: ["text_bold"] },
    ],
    rows: [{ cells: {
      period: { value: "1 месяц", annotation: "", cell_formatter: [] },
      price: { value: "25000 ₽", annotation: "", cell_formatter: ["text_bold"] },
    } }],
  }],
} as unknown as PriceOutWithTablesDto;

beforeEach(() => { vi.mocked(loadBoardingDetail).mockReset(); });

describe("UT-BOARDING-DETAIL direct server entry", () => {
  it("renders one h1, photo, description and the tariff table with column headers and cells", async () => {
    expect(dynamic).toBe("force-dynamic");
    vi.mocked(loadBoardingDetail).mockResolvedValue({ status: "success", data: tariff });
    const html = renderToStaticMarkup(await Page(props()));
    expect(loadBoardingDetail).toHaveBeenCalledWith("horse-boarding-yandex");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Постой частных лошадей");
    expect(html).toContain("Полный пансион для лошади.");
    expect(html).toContain('src="/boarding.jpg"');
    expect(html).toContain("Период");
    expect(html).toContain("1 месяц");
    expect(html).toContain("25000 ₽");
    expect(html).toContain('href="/uslugi/postoy"');
  });

  it("uses tariff name/description for metadata and its own slug canonical", async () => {
    vi.mocked(loadBoardingDetail).mockResolvedValue({ status: "success", data: tariff });
    expect(await generateMetadata(props())).toMatchObject({
      title: "Постой частных лошадей | Инлав",
      description: "Полный пансион для лошади.",
      alternates: { canonical: "/uslugi/postoy/horse-boarding-yandex" },
    });
  });
});

describe("UT-BOARDING-DETAIL allow-list and data failures", () => {
  it("raises route 404 for a slug outside this page's allow-list (loader returns not-found)", async () => {
    vi.mocked(loadBoardingDetail).mockResolvedValue({ status: "not-found" });
    await expect(Page(props())).rejects.toThrow("route-404");
    await expect(generateMetadata(props())).rejects.toThrow("route-404");
  });

  it.each([401, 500, 503, undefined])("keeps %s failure separate from 404 and marks noindex", async (statusCode) => {
    vi.mocked(loadBoardingDetail).mockResolvedValue({ status: "error", statusCode });
    const html = renderToStaticMarkup(await Page(props()));
    expect(html).toContain("Не удалось загрузить информацию о постое");
    expect(html).not.toContain(tariff.name);
    expect(await generateMetadata(props())).toMatchObject({ robots: { index: false, follow: true } });
  });
});
