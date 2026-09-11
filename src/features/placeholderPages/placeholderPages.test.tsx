// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnderConstructionPage } from "./UnderConstructionPage";
import { createRouteMetadata, PLACEHOLDER_ROUTES } from "./metadata";


// `/uslugi/zanyatiya`, `/uslugi/progulki`, `/uslugi/postoy` and `/loshadi` were replaced with real
// SSR content by inlove-dynamic-pages (SC-1..SC-4) and no longer use UnderConstructionPage; these
// fixtures keep multi-heading regression coverage of the reusable component itself (retained for
// future placeholders) without referencing the now-removed PLACEHOLDER_ROUTES entries.
const HEADING_FIXTURES = [
  { heading: "Занятия и абонементы" },
  { heading: "Конные прогулки" },
  { heading: "Постой лошадей" },
  { heading: "Наши лошади" },
] as const;

describe("REN-PAGE-01 route SSR content", () => {
  it.each(HEADING_FIXTURES)("renders one route-specific h1 for $heading", ({ heading }) => {
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
  it.each(Object.entries(PLACEHOLDER_ROUTES))("provides fallback metadata and canonical for %s", async (route, config) => {
    const metadata = await createRouteMetadata(route as keyof typeof PLACEHOLDER_ROUTES);
    expect(metadata.title).toBe(config.title);
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates).toEqual({ canonical: config.path });
  });

  it("keeps metadata independent from removed SEO settings", () => {
    expect(createRouteMetadata("news")).toMatchObject({ title: "Инлав | Новости", description: expect.any(String) });
  });
});
