import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { loadAboutData } from "@/features/contentPages/services/loaders";
import AboutPage from "./page";

vi.mock("@/features/contentPages/services/loaders", async (original) => {
  const actual = await original<typeof import("@/features/contentPages/services/loaders")>();
  return { ...actual, loadAboutData: vi.fn() };
});

const loadAboutDataMock = vi.mocked(loadAboutData);

describe("/about privacy fallback target", () => {
  it("renders an accessible privacy anchor in server HTML", async () => {
    loadAboutDataMock.mockResolvedValue({
      settings: { status: "success", data: [] },
      photos: { status: "success", data: [] },
    });

    const html = renderToStaticMarkup(await AboutPage());

    expect(html).toContain('id="privacy"');
    expect(html).toContain('aria-labelledby="privacy-heading"');
    expect(html).toContain('id="privacy-heading"');
    expect(html).toContain("Обработка персональных данных");
  });
});
