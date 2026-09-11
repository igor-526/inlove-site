import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page, { dynamic, generateMetadata } from "@/app/loshadi/[slug]/page";
import { loadHorseDetail, type HorseCardDto } from "./loaders";

vi.mock("./loaders", async (original) => ({
  ...await original<typeof import("./loaders")>(),
  loadHorseDetail: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("route-404"); } }));

const props = () => ({ params: Promise.resolve({ slug: "marta" }) });
const horse = (overrides: Partial<HorseCardDto> = {}): HorseCardDto => ({
  id: "123e4567-e89b-42d3-a456-426614174000", slug: "marta", name: "Марта", pedigree_name: null,
  description: "Спокойная и внимательная лошадь для новичков.",
  breed: { id: "223e4567-e89b-42d3-a456-426614174000", name: "Орловская рысистая" },
  coat_color: { id: "323e4567-e89b-42d3-a456-426614174000", name: "Гнедая" },
  height: 152, sex: "female", bdate_formatted: "2015", age: 11,
  photos: [{ id: "423e4567-e89b-42d3-a456-426614174000", is_main: true, url: "/marta.jpg" }],
  services: [{ id: "523e4567-e89b-42d3-a456-426614174000", name: "Прогулки" }],
  this_stable: true, ...overrides,
});

beforeEach(() => { vi.mocked(loadHorseDetail).mockReset(); });

describe("UT-HORSES-DETAIL direct server entry", () => {
  it("renders one h1, photo, non-empty traits, description and services for a public (this_stable) horse", async () => {
    expect(dynamic).toBe("force-dynamic");
    vi.mocked(loadHorseDetail).mockResolvedValue({ status: "success", data: horse() });
    const html = renderToStaticMarkup(await Page(props()));
    expect(loadHorseDetail).toHaveBeenCalledWith("marta");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Марта");
    expect(html).toContain("Орловская рысистая");
    expect(html).toContain("Гнедая");
    expect(html).toContain("152 см");
    expect(html).toContain("Кобыла");
    expect(html).toContain("2015");
    expect(html).toContain("11 лет");
    expect(html).toContain("Спокойная и внимательная лошадь для новичков.");
    expect(html).toContain("Прогулки");
    expect(html).toContain("src=\"/marta.jpg\"");
    expect(html).toContain('href="/loshadi"');
  });

  it("uses horse name/description for metadata and its own slug canonical", async () => {
    vi.mocked(loadHorseDetail).mockResolvedValue({ status: "success", data: horse() });
    expect(await generateMetadata(props())).toMatchObject({
      title: "Марта | Инлав",
      description: "Спокойная и внимательная лошадь для новичков.",
      alternates: { canonical: "/loshadi/marta" },
    });
  });
});

describe("UT-HORSES-DETAIL this_stable privacy guard (D3)", () => {
  it("raises route 404 for a horse with this_stable: false, even though the loader resolved data", async () => {
    vi.mocked(loadHorseDetail).mockResolvedValue({ status: "not-found" });
    await expect(Page(props())).rejects.toThrow("route-404");
    await expect(generateMetadata(props())).rejects.toThrow("route-404");
  });

  it("raises route 404 for a nonexistent or another tenant's slug (backend 404)", async () => {
    vi.mocked(loadHorseDetail).mockResolvedValue({ status: "not-found" });
    await expect(Page(props())).rejects.toThrow("route-404");
  });
});

describe("UT-HORSES-DETAIL data failures", () => {
  it.each([401, 500, 503, undefined])("keeps %s failure separate from 404 and marks noindex", async (statusCode) => {
    vi.mocked(loadHorseDetail).mockResolvedValue({ status: "error", statusCode });
    const html = renderToStaticMarkup(await Page(props()));
    expect(html).toContain("Не удалось загрузить лошадь");
    expect(html).not.toContain("Марта");
    expect(await generateMetadata(props())).toMatchObject({ robots: { index: false, follow: true } });
  });
});
