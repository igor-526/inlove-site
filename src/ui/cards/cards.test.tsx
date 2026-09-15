// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Carousel, Gallery, MapEmbed } from "../media";
import { FeatureItem, HorseCard, NewsCard, PersonCard, PriceRow, ReviewSummary, ServiceCard, TariffCard } from "./index";

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

describe("UT-SC-02/03 TariffCard image link and mobile ratio", () => {
  const tariff = { name: "Абонемент на 8 занятий", slug: "abonement-8", tables: [] };

  it("UT-SC-02 wraps the image in a Link pointing at the tariff detail page, and falls back to a plain image without detailHref", () => {
    const withLink = render(<TariffCard tariff={tariff} detailHref="/uslugi/zanyatiya/abonement-8" onRequest={vi.fn()} />);
    const link = withLink.getByRole("link", { name: "Абонемент на 8 занятий" });
    expect(link.getAttribute("href")).toBe("/uslugi/zanyatiya/abonement-8");
    expect(link.querySelector("img, [role='img']")).toBeTruthy();
    expect(withLink.getByText("Подробнее")).toBeTruthy();
    withLink.unmount();

    const withoutLink = render(<TariffCard tariff={tariff} onRequest={vi.fn()} />);
    expect(withoutLink.queryByRole("link")).toBeNull();
    expect(withoutLink.container.querySelector("img, [role='img']")).toBeTruthy();
    withoutLink.unmount();
  });

  it("UT-SC-03 defines a mobile-only reduced image ratio and disables pointer events on the image link, distinct from the desktop 4:5 ratio", () => {
    const css = readFileSync(`${process.cwd()}/src/ui/cards/cards.module.css`, "utf8");
    const mobileBlock = css.slice(css.indexOf("@media(max-width:767px)"));
    expect(mobileBlock).toContain(".tariffImageLink{pointer-events:none}");
    expect(mobileBlock).toContain(".tariffImageLink span:first-child{aspect-ratio:3/2}");
    expect(mobileBlock).not.toContain("aspect-ratio:4/5");
  });
});

describe("UT-SC-01 NewsCard compact horizontal variant", () => {
  const news = { id: "1", name: "Открытие нового манежа", snippet: "Подробности внутри новости", photo: { src: "/news.jpg", alt: "Манеж" } };

  it("renders image and text side by side via a horizontal grid, full width, distinct from the default vertical card", () => {
    const compact = render(<NewsCard news={news} variant="compact" href="/novosti/1" />);
    const article = compact.container.querySelector("article");
    expect(article?.className).toMatch(/newsCompact/);
    expect(article?.className).not.toMatch(/featured/);
    expect(article?.children).toHaveLength(2);
    expect(article?.children[0].tagName).toBe("SPAN");
    expect(article?.children[1].className).toMatch(/cardBody/);
    compact.unmount();

    const vertical = render(<NewsCard news={news} href="/novosti/1" />);
    expect(vertical.container.querySelector("article")?.className).not.toMatch(/newsCompact/);
    vertical.unmount();
  });

  it("defines the compact layout as a two-column grid spanning the full row, with a single-column mobile fallback", () => {
    const css = readFileSync(`${process.cwd()}/src/ui/cards/cards.module.css`, "utf8");
    expect(css).toMatch(/\.newsCompact\{grid-column:1\/-1;display:grid;grid-template-columns:[^;]+;/);
    const mobileBlock = css.slice(css.indexOf("@media(max-width:767px)"));
    expect(mobileBlock).toContain(".newsCompact{grid-template-columns:1fr}");
  });
});
