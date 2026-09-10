// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteSettingList } from "@/api/siteSettings";
import { UnderConstructionPage } from "./UnderConstructionPage";
import { createRouteMetadata, PLACEHOLDER_ROUTES } from "./metadata";

vi.mock("@/api/siteSettings", () => ({ siteSettingList: vi.fn() }));
const siteSettingListMock = vi.mocked(siteSettingList);

describe("REN-PAGE-01 route SSR content", () => {
  it.each([PLACEHOLDER_ROUTES.lessons, PLACEHOLDER_ROUTES.rides, PLACEHOLDER_ROUTES.boarding, PLACEHOLDER_ROUTES.horses])("renders one route-specific h1 for $path", ({ heading }) => {
    const { container, unmount } = render(<UnderConstructionPage heading={heading} />);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeTruthy();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByText(/раздел находится в разработке/i)).toBeTruthy();
    unmount();
  });

  it("keeps the privacy fragment as an accessible SSR section", () => {
    const { container } = render(<UnderConstructionPage heading="О клубе" privacyAnchor />);
    expect(container.querySelector("#privacy")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: /политика обработки/i })).toBeTruthy();
  });
});

describe("REN-PAGE-02 server metadata", () => {
  beforeEach(() => siteSettingListMock.mockResolvedValue({ status: "ok", data: [] } as never));

  it.each(Object.entries(PLACEHOLDER_ROUTES))("provides fallback metadata and canonical for %s", async (route, config) => {
    const metadata = await createRouteMetadata(route as keyof typeof PLACEHOLDER_ROUTES);
    expect(metadata.title).toBe(config.title);
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates).toEqual({ canonical: config.path });
  });

  it("prefers route SEO settings to defaults", async () => {
    siteSettingListMock.mockResolvedValue({ status: "ok", data: [
      { key: "seo.rides.title", value: "Прогулка в лесу", type: "string" },
      { key: "seo.rides.description", value: "Описание прогулок", type: "string" },
      { key: "seo.default_title", value: "Общий заголовок", type: "string" },
    ] } as never);
    await expect(createRouteMetadata("rides")).resolves.toMatchObject({ title: "Прогулка в лесу", description: "Описание прогулок" });
  });
});
