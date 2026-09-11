// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RidesContent, ridesMetadata } from "./RidesContent";
import type { loadRidesData } from "../services/ridesLoaders";
import type { PriceOutWithTablesDto } from "@/types/prices";

afterEach(cleanup);

type Data = Awaited<ReturnType<typeof loadRidesData>>;
const setting = (key: string, value: string, type = "string") => ({ key, value, type });
const price = (slug: string, name: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "123e4567-e89b-42d3-a456-426614174000", name, slug, description: "Описание прогулки",
  photos: [], groups: [], price_tables: [], created_at: "2026-01-01T00:00:00Z", updated_at: null, ...overrides,
}) as unknown as PriceOutWithTablesDto;
const official = price("horse-rides-official", "Конная прогулка (клуб)");
const yandex = price("horse-ride-yandex", "Конная прогулка (Яндекс)");
const empty: Data = { group: { status: "empty" }, settings: { status: "empty" }, prices: { status: "empty" } };
const group: Data["group"] = { status: "success", data: {
  id: "223e4567-e89b-42d3-a456-426614174000", name: "Прогулки", slug: "progulki",
  description: "Спокойные прогулки рядом с клубом.", price: 0,
  created_at: "2026-01-01T00:00:00Z", updated_at: null,
} as never };

describe("Rides SSR content", () => {
  it("renders one h1, both conflicting offers separately with their own CMS name, and the final CTA", () => {
    const data: Data = { group,
      settings: { status: "success", data: [
        setting("services.rides.preparation", '["Удобная одежда"]', "object"),
        setting("services.rides.safety", '["Слушайте инструктора"]', "object"),
      ] },
      prices: { status: "success", data: [official, yandex] },
    };
    const { container, getAllByRole } = render(<RidesContent data={data} />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.textContent).toContain("Конная прогулка (клуб)");
    expect(container.textContent).toContain("Конная прогулка (Яндекс)");
    expect(container.textContent).toContain("Выбирайте удобную одежду");
    expect(container.textContent).toContain("Следуйте указаниям инструктора");
    expect(getAllByRole("button", { name: "Записаться на прогулку" }).length).toBeGreaterThanOrEqual(1);
  });

  it("keeps CTA and shows the price-unknown fallback instead of a blank list when prices are empty", () => {
    const { container, getByRole } = render(<RidesContent data={empty} />);
    expect(container.textContent).toContain("Стоимость уточняется");
    expect(getByRole("button", { name: "Уточнить стоимость" })).toBeTruthy();
    expect(container.textContent).not.toContain("0 ₽");
  });

  it("shows a retry action on price fetch failure without hiding the rest of the page", () => {
    const data: Data = { ...empty, group, prices: { status: "error", statusCode: 503 } };
    const { container, getByRole } = render(<RidesContent data={data} />);
    expect(container.textContent).toContain("Не удалось загрузить стоимость.");
    expect(getByRole("button", { name: "Повторить" })).toBeTruthy();
    expect(getByRole("heading", { name: "Прогулки" })).toBeTruthy();
  });

  it("uses static presentation copy and ignores removed ride/about settings", () => {
    const data: Data = { group, settings: { status: "success", data: [setting("about.setting", "LEGACY"), setting("services.rides.preparation", '["LEGACY"]', "object")] }, prices: { status: "empty" } };
    const { container } = render(<RidesContent data={data} />);
    expect(container.textContent).toContain("Маршрут проходит в спокойной природной обстановке");
    expect(container.textContent).toContain("Подготовка и безопасность");
    expect(container.textContent).not.toContain("LEGACY");
  });

  it("uses static SEO and ignores removed SEO/short-name settings", () => {
    expect(ridesMetadata(empty.settings)).toMatchObject({ title: "Инлав | Прогулки", alternates: { canonical: "/uslugi/progulki" } });
    expect(ridesMetadata({ status: "success", data: [setting("site.short_name", "LEGACY"), setting("seo.rides.title", "LEGACY")] }).title).toBe("Инлав | Прогулки");
  });
});
