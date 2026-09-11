// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HorsesContent, horsesMetadata } from "./HorsesContent";
import type { HorseCardDto, loadHorsesData } from "./loaders";

afterEach(cleanup);

type Data = Awaited<ReturnType<typeof loadHorsesData>>;
const setting = (key: string, value: string, type = "string") => ({ key, value, type });
const horse = (slug: string, name: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "123e4567-e89b-42d3-a456-426614174000", slug, name, pedigree_name: null, description: "Спокойная и внимательная лошадь",
  breed: { id: "223e4567-e89b-42d3-a456-426614174000", name: "Орловская рысистая" },
  coat_color: { id: "323e4567-e89b-42d3-a456-426614174000", name: "Гнедая" },
  height: 152, sex: "female", bdate_formatted: "2015", age: 11,
  photos: [], services: [], this_stable: true, ...overrides,
}) as unknown as HorseCardDto;
const empty: Data = { settings: { status: "empty" }, horses: { status: "empty" } };

describe("Horses SSR content", () => {
  it("renders one h1, the intro, a horse card and the final CTA", () => {
    const data: Data = {
      settings: { status: "success", data: [setting("horses.intro", "Знакомьтесь с лошадьми нашего клуба")] },
      horses: { status: "success", data: [horse("marta", "Марта")] },
    };
    const { container, getByRole } = render(<HorsesContent data={data} />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.textContent).toContain("Наши лошади");
    expect(container.textContent).toContain("Знакомьтесь с лошадьми нашего клуба");
    expect(getByRole("heading", { name: "Марта" })).toBeTruthy();
    expect(container.textContent).toContain("Орловская рысистая");
    expect(getByRole("heading", { name: "Хотите познакомиться лично?" })).toBeTruthy();
    expect(getByRole("button", { name: "Записаться в клуб" })).toBeTruthy();
  });

  it("expands and collapses in-page horse details via the toggle", () => {
    const data: Data = { ...empty, horses: { status: "success", data: [horse("marta", "Марта", { bdate_formatted: "2015-04-01", services: [{ id: "s1", name: "Прогулки" }] })] } };
    const { getByRole, queryByText } = render(<HorsesContent data={data} />);
    expect(queryByText("Прогулки")).toBeNull();
    fireEvent.click(getByRole("button", { name: "Показать подробности" }));
    expect(queryByText("Прогулки")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "Скрыть подробности" }));
    expect(queryByText("Прогулки")).toBeNull();
  });

  it("links each card to its own detail route", () => {
    const data: Data = { ...empty, horses: { status: "success", data: [horse("marta", "Марта")] } };
    const { getByRole } = render(<HorsesContent data={data} />);
    expect(getByRole("link", { name: /Подробнее/ }).getAttribute("href")).toBe("/loshadi/marta");
  });

  it("keeps the CTA and shows the empty_text fallback instead of a blank grid", () => {
    const { container, getAllByRole } = render(<HorsesContent data={empty} />);
    expect(container.textContent).toContain("Скоро познакомим вас с лошадьми клуба");
    expect(getAllByRole("button", { name: "Записаться в клуб" }).length).toBeGreaterThanOrEqual(1);
  });

  it("uses a seeded horses.empty_text over the fallback", () => {
    const data: Data = { settings: { status: "success", data: [setting("horses.empty_text", "Каталог обновляется")] }, horses: { status: "empty" } };
    const { container } = render(<HorsesContent data={data} />);
    expect(container.textContent).toContain("Каталог обновляется");
    expect(container.textContent).not.toContain("Скоро познакомим вас с лошадьми клуба");
  });

  it("shows a retry action on fetch failure without hiding the rest of the page", () => {
    const data: Data = { ...empty, horses: { status: "error", statusCode: 503 } };
    const { container, getByRole } = render(<HorsesContent data={data} />);
    expect(container.textContent).toContain("Не удалось загрузить лошадей.");
    expect(getByRole("button", { name: "Повторить" })).toBeTruthy();
    expect(getByRole("heading", { name: "Наши лошади" })).toBeTruthy();
  });

  it("uses seeded SEO then short_name fallback and canonical path", () => {
    expect(horsesMetadata(empty.settings)).toMatchObject({ title: "Инлав | Лошади", alternates: { canonical: "/loshadi" } });
    expect(horsesMetadata({ status: "success", data: [setting("site.short_name", "Инлав-Клуб")] }).title).toBe("Инлав-Клуб | Лошади");
    expect(horsesMetadata({ status: "success", data: [setting("seo.horses.title", "Лошади — заголовок")] }).title).toBe("Лошади — заголовок");
  });
});
