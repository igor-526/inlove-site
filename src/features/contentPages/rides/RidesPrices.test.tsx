// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PriceOutWithTablesDto } from "@/types/prices";
import { RidesPrices } from "./RidesPrices";

afterEach(cleanup);

const price = (slug: string, name: string) => ({
  id: "123e4567-e89b-42d3-a456-426614174000", name, slug, description: "Описание прогулки",
  photos: [], groups: [{ id: "223e4567-e89b-42d3-a456-426614174000", name: "Прогулки" }],
  price_tables: [], created_at: "2026-01-01T00:00:00Z", updated_at: null,
} as unknown as PriceOutWithTablesDto);

describe("UT-SC-09 rides prices never render the removed notice", () => {
  it("renders no notice text for success, empty or error states, and RidesPrices no longer accepts a notice prop", () => {
    const official = price("horse-rides-official", "Конная прогулка (клуб)");
    const { container, rerender } = render(<RidesPrices prices={{ status: "success", data: [official] }} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    rerender(<RidesPrices prices={{ status: "empty" }} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    rerender(<RidesPrices prices={{ status: "error", statusCode: 503 }} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    // @ts-expect-error notice is no longer part of the RidesPrices prop contract (FE-4B.3).
    render(<RidesPrices prices={{ status: "empty" }} notice="Цены могут измениться" />);
    expect(document.body.textContent).not.toMatch(/переменны|нескольких источников/i);
  });
});

describe("UT-SC-07 empty group response", () => {
  it("shows the price-unknown fallback with a working CTA instead of a blank list", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    const { container, getByRole } = render(<RidesPrices prices={{ status: "empty" }} />);
    expect(container.textContent).toContain("Стоимость уточняется");
    fireEvent.click(getByRole("button", { name: "Уточнить стоимость" }));
    expect(dispatch).toHaveBeenCalled();
  });
});

describe("UT-SC-08 loader failure", () => {
  it("renders an error state with a retry control", () => {
    const { getByRole } = render(<RidesPrices prices={{ status: "error", statusCode: 503 }} />);
    expect(getByRole("button", { name: "Повторить" })).toBeTruthy();
  });
});
