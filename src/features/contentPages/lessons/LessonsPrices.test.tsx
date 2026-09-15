// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PriceOutWithTablesDto } from "@/types/prices";
import { LessonsPrices } from "./LessonsPrices";

afterEach(cleanup);

const price = (slug: string, name: string, groupName: "Разовые" | "Абонементы") => ({
  id: "123e4567-e89b-42d3-a456-426614174000", name, slug, description: "Описание тарифа",
  photos: [], groups: [{ id: "223e4567-e89b-42d3-a456-426614174000", name: groupName }],
  price_tables: [], created_at: "2026-01-01T00:00:00Z", updated_at: null,
} as unknown as PriceOutWithTablesDto);

describe("UT-SC-09 lessons prices never render the removed notice", () => {
  it("renders no notice text for success, empty or error states", () => {
    const single = price("individual-lesson-official", "Индивидуальное занятие", "Разовые");
    const { container, rerender } = render(<LessonsPrices prices={{ status: "success", data: [single] }} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    rerender(<LessonsPrices prices={{ status: "empty" }} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    rerender(<LessonsPrices prices={{ status: "error", statusCode: 503 }} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
  });
});

describe("UT-SC-07 empty group response", () => {
  it("shows the price-unknown fallback with a working CTA instead of a blank list", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    const { container, getByRole } = render(<LessonsPrices prices={{ status: "empty" }} />);
    expect(container.textContent).toContain("Стоимость уточняется");
    fireEvent.click(getByRole("button", { name: "Уточнить стоимость" }));
    expect(dispatch).toHaveBeenCalled();
  });

  it("also falls back when the current toggle category has no matching items", () => {
    const subscriptionOnly = price("subscription-8-yandex", "Абонемент на 8 занятий", "Абонементы");
    const { container } = render(<LessonsPrices prices={{ status: "success", data: [subscriptionOnly] }} />);
    // default toggle state is "Разовые" — no item belongs to that group here.
    expect(container.textContent).toContain("Стоимость уточняется");
  });
});

describe("UT-SC-08 loader failure", () => {
  it("renders an error state with a retry control", () => {
    const { getByRole } = render(<LessonsPrices prices={{ status: "error", statusCode: 503 }} />);
    expect(getByRole("button", { name: "Повторить" })).toBeTruthy();
  });
});

describe("backend-driven category toggle", () => {
  it("shows only the tariff belonging to the active toggle group, keyed by the tariff's own groups field", () => {
    const single = price("individual-lesson-official", "Индивидуальное занятие", "Разовые");
    const subscription = price("subscription-8-yandex", "Абонемент на 8 занятий", "Абонементы");
    const { container, getByRole } = render(<LessonsPrices prices={{ status: "success", data: [single, subscription] }} />);
    expect(container.textContent).toContain("Индивидуальное занятие");
    expect(container.textContent).not.toContain("Абонемент на 8 занятий");
    fireEvent.click(getByRole("tab", { name: "Абонементы" }));
    expect(container.textContent).toContain("Абонемент на 8 занятий");
    expect(container.textContent).not.toContain("Индивидуальное занятие");
  });
});
