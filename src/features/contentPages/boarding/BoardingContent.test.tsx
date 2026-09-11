// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BoardingContent, boardingMetadata } from "./BoardingContent";
import type { loadBoardingData } from "../services/boardingLoaders";
import type { PriceOutWithTablesDto } from "@/types/prices";

afterEach(cleanup);

type Data = Awaited<ReturnType<typeof loadBoardingData>>;
const setting = (key: string, value: string, type = "string") => ({ key, value, type });
const price = (slug: string, name: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "123e4567-e89b-42d3-a456-426614174000", name, slug, description: "Описание постоя",
  photos: [], groups: [], price_tables: [], created_at: "2026-01-01T00:00:00Z", updated_at: null, ...overrides,
}) as unknown as PriceOutWithTablesDto;
const boarding = price("horse-boarding-yandex", "Постой частных лошадей");
const empty: Data = { group: { status: "empty" }, settings: { status: "empty" }, prices: { status: "empty" } };
const group: Data["group"] = { status: "success", data: {
  id: "223e4567-e89b-42d3-a456-426614174000", name: "Постой", slug: "postoy",
  description: "Постой частных лошадей", price: 0,
  created_at: "2026-01-01T00:00:00Z", updated_at: null,
} as never };

describe("Boarding SSR content", () => {
  it("renders one h1, the tariff and the final CTA", () => {
    const data: Data = { group,
      settings: { status: "success", data: [] },
      prices: { status: "success", data: [boarding] },
    };
    const { container, getAllByRole } = render(<BoardingContent data={data} />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.textContent).toContain("Постой частных лошадей");
    expect(getAllByRole("button", { name: "Записаться на постой" }).length).toBeGreaterThanOrEqual(1);
  });

  it("keeps CTA and shows the price-and-availability-unknown fallback instead of a free service when prices are empty", () => {
    const { container, getByRole } = render(<BoardingContent data={empty} />);
    expect(container.textContent).toContain("Стоимость и наличие мест уточняются");
    expect(getByRole("button", { name: "Уточнить стоимость" })).toBeTruthy();
    expect(container.textContent).not.toContain("0 ₽");
  });

  it("shows a retry action on price fetch failure without hiding the rest of the page", () => {
    const data: Data = { ...empty, group, prices: { status: "error", statusCode: 503 } };
    const { container, getByRole } = render(<BoardingContent data={data} />);
    expect(container.textContent).toContain("Не удалось загрузить стоимость.");
    expect(getByRole("button", { name: "Повторить" })).toBeTruthy();
    expect(getByRole("heading", { name: "Постой" })).toBeTruthy();
  });

  it("uses the static included list and ignores removed boarding settings", () => {
    const data: Data = { group, settings: { status: "success", data: [setting("services.boarding.included", '["LEGACY"]', "object")] }, prices: { status: "empty" } };
    const { container } = render(<BoardingContent data={data} />);
    expect(container.textContent).toContain("Что входит");
    expect(container.textContent).toContain("Безопасное размещение");
    expect(container.textContent).not.toContain("LEGACY");
  });

  it("renders static requirements and ignores removed about/features settings", () => {
    const data: Data = { group, settings: { status: "success", data: [setting("services.boarding.requirements", '["LEGACY"]', "object"), setting("about.features", '["LEGACY"]', "object")] }, prices: { status: "empty" } };
    const { container } = render(<BoardingContent data={data} />);
    expect(container.textContent).toContain("Требования и знакомство с клубом");
    expect(container.textContent).toContain("Условия размещения и наличие мест подтверждаются");
    expect(container.textContent).not.toContain("LEGACY");
  });

  it("uses static SEO and ignores removed SEO/short-name settings", () => {
    expect(boardingMetadata(empty.settings)).toMatchObject({ title: "Инлав | Постой", alternates: { canonical: "/uslugi/postoy" } });
    expect(boardingMetadata({ status: "success", data: [setting("site.short_name", "LEGACY"), setting("seo.boarding.title", "LEGACY")] }).title).toBe("Инлав | Постой");
  });
});
