// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LessonsContent, lessonsMetadata } from "./LessonsContent";
import type { loadLessonsData } from "../services/lessonsLoaders";
import type { PriceOutWithTablesDto } from "@/types/prices";

afterEach(cleanup);

type Data = Awaited<ReturnType<typeof loadLessonsData>>;
const setting = (key: string, value: string, type = "string") => ({ key, value, type });
const price = (slug: string, name: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "123e4567-e89b-42d3-a456-426614174000", name, slug, description: "Описание тарифа",
  photos: [], groups: [], price_tables: [], created_at: "2026-01-01T00:00:00Z", updated_at: null, ...overrides,
}) as unknown as PriceOutWithTablesDto;
const single = price("individual-lesson-official", "Индивидуальное занятие");
const subscription = price("subscription-8-yandex", "Абонемент на 8 занятий");
const empty: Data = { group: { status: "empty" }, settings: { status: "empty" }, prices: { status: "empty" } };
const group: Data["group"] = { status: "success", data: {
  id: "223e4567-e89b-42d3-a456-426614174000", name: "Занятия", slug: "zanyatiya",
  description: "Занятия для всадников с разным уровнем подготовки.", price: 0,
  created_at: "2026-01-01T00:00:00Z", updated_at: null,
} as never };

describe("Lessons SSR content", () => {
  it("renders one h1, default single-category tariffs, benefits and final CTA", () => {
    const data: Data = { group,
      settings: { status: "success", data: [setting("home.program_benefits", '[{"title":"LEGACY"}]', "object")] },
      prices: { status: "success", data: [single, subscription] },
    };
    const { container, getByRole } = render(<LessonsContent data={data} />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.textContent).toContain("Индивидуальное занятие");
    expect(container.textContent).not.toContain("Абонемент на 8 занятий");
    expect(getByRole("heading", { name: "Бережный подход" })).toBeTruthy();
    expect(container.textContent).not.toContain("LEGACY");
    expect(getByRole("button", { name: "Записаться на занятие" })).toBeTruthy();
  });

  it("keeps CTA and shows the price-unknown fallback instead of a blank list when the group is empty", () => {
    const { container, getByRole } = render(<LessonsContent data={empty} />);
    expect(container.textContent).toContain("Стоимость уточняется");
    expect(getByRole("button", { name: "Уточнить стоимость" })).toBeTruthy();
    expect(container.textContent).not.toContain("0 ₽");
  });

  it("shows a retry link on price fetch failure without hiding the rest of the page", () => {
    const data: Data = { ...empty, group, prices: { status: "error", statusCode: 503 } };
    const { container, getByRole } = render(<LessonsContent data={data} />);
    expect(container.textContent).toContain("Не удалось загрузить стоимость.");
    expect(getByRole("button", { name: "Повторить" })).toBeTruthy();
    expect(getByRole("heading", { name: "Занятия и абонементы" })).toBeTruthy();
    expect(getByRole("button", { name: "Записаться на занятие" })).toBeTruthy();
  });

  it("switches to subscriptions via the Разовые/Абонементы toggle", () => {
    const data: Data = { ...empty, group, prices: { status: "success", data: [single, subscription] } };
    const { container, getByRole } = render(<LessonsContent data={data} />);
    fireEvent.click(getByRole("tab", { name: "Абонементы" }));
    expect(container.textContent).toContain("Абонемент на 8 занятий");
    expect(container.textContent).not.toContain("Индивидуальное занятие");
  });

  it("uses static SEO and ignores removed SEO/short-name settings", () => {
    expect(lessonsMetadata(empty.settings)).toMatchObject({ title: "Инлав | Занятия и абонементы", alternates: { canonical: "/uslugi/zanyatiya" } });
    expect(lessonsMetadata({ status: "success", data: [setting("site.short_name", "LEGACY"), setting("seo.lessons.title", "LEGACY")] }).title).toBe("Инлав | Занятия и абонементы");
  });
});
