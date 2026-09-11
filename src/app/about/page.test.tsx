import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { loadAboutData } from "@/features/contentPages/services/loaders";
import AboutPage from "./page";

vi.mock("@/features/contentPages/services/loaders", async (original) => {
  const actual = await original<typeof import("@/features/contentPages/services/loaders")>();
  return { ...actual, loadAboutData: vi.fn() };
});

const loadAboutDataMock = vi.mocked(loadAboutData);

describe("/about curated content", () => {
  it("does not restore the removed privacy block", async () => {
    loadAboutDataMock.mockResolvedValue({
      settings: { status: "success", data: [] },
    });

    const html = renderToStaticMarkup(await AboutPage());

    expect(html).not.toContain('id="privacy"');
    expect(html).not.toContain("Обработка персональных данных");
  });
});
