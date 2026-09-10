// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Carousel, Gallery, MapEmbed } from "../media";
import { FeatureItem, HorseCard, NewsCard, PersonCard, PriceRow, ReviewSummary, ServiceCard } from "./index";

describe("CT-ILUI-04 media and content cards", () => {
  it("renders long data without invented media, date or price values", () => {
    const longText = "Очень длинное описание ".repeat(30);
    const { container } = render(<><ServiceCard price={{ name: "Занятия", description: longText }} onRequest={vi.fn()} /><PriceRow name="Прогулка" description="Описание" priceTables={[]} onRequest={vi.fn()} /><NewsCard news={{ id: 1, name: "Новость без фотографии" }} onOpen={vi.fn()} /></>);
    expect(container.textContent).toContain(longText);
    expect(container.textContent).toContain("Стоимость уточняется");
    expect(container.textContent).not.toContain("0 ₽");
    expect(container.querySelector("time")).toBeNull();
    expect(container.textContent).toContain("Изображение недоступно");
  });

  it("keeps horse essentials visible and reveals optional detail accessibly", () => {
    const toggle = vi.fn();
    const { getByRole, rerender } = render(<HorseCard horse={{ name: "Марта", breed: "Орловская", description: "Спокойная и внимательная", services: ["Прогулки"] }} onToggle={toggle} onRequest={vi.fn()} />);
    expect(getByRole("heading", { name: "Марта" })).toBeTruthy();
    expect(getByRole("button", { name: "Показать подробности" }).getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(getByRole("button", { name: "Показать подробности" }));
    expect(toggle).toHaveBeenCalledOnce();
    rerender(<HorseCard expanded horse={{ name: "Марта", services: ["Прогулки"] }} onToggle={toggle} onRequest={vi.fn()} />);
    expect(getByRole("button", { name: "Скрыть подробности" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("supports keyboard carousel announcements and neutral empty media", () => {
    const items = [{ src: "/one.jpg", alt: "Первая" }, { src: "/two.jpg", alt: "Вторая" }];
    const { container, getByText } = render(<><Carousel items={items} /><Gallery items={[]} /><MapEmbed address="Адрес клуба" /></>);
    const track = container.querySelector('[tabindex="0"]') as HTMLElement;
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(getByText("Изображение 2 из 2")).toBeTruthy();
    expect(container.textContent).toContain("Карта недоступна");
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("omits empty editorial entities and gives ratings a textual form", () => {
    const { container } = render(<><PersonCard name="" roles={[]} /><FeatureItem id="arena" label="Манеж" value="" /><ReviewSummary rating={4.9} rating_count={42} review_count={31} strengths={["Забота о лошадях"]} collected_at="2026-09-01" /></>);
    expect(container.querySelectorAll("article")).toHaveLength(0);
    expect(container.textContent).toContain("Оценка 4,9 из 5");
    expect(container.textContent).toContain("Забота о лошадях");
  });
});
