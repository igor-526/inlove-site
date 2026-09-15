// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BenefitsSection,
  ConditionsSection,
  ContactSection,
  EditorialSplitSection,
  HorsesSection,
  IntroSection,
  NewsSection,
  PreparationSafetySection,
  PricesSection,
  PrivacySection,
} from "./index";

describe("CT-ILUI-04 reusable sections", () => {
  it("keeps editorial text before its image and preserves long content", () => {
    const longText = "Спокойный подробный рассказ о клубе ".repeat(40);
    const { container, getByRole } = render(<><IntroSection eyebrow="О клубе" title="Добро пожаловать" body={longText} /><EditorialSplitSection title="Природа рядом" body={longText} image={{ src: "/club.jpg", alt: "Территория клуба" }} imageSide="left" /></>);
    expect(container.textContent).toContain(longText);
    const split = getByRole("heading", { name: "Природа рядом" }).closest("div")?.parentElement;
    expect(split?.firstElementChild?.textContent).toContain("Природа рядом");
    expect(split?.lastElementChild?.querySelector("img")?.getAttribute("alt")).toBe("Территория клуба");
  });

  it("IntroSection.spacing defaults to editorial and accepts compact without changing structure", () => {
    const { container, rerender } = render(<IntroSection title="Заголовок" body="Текст" />);
    expect(container.querySelector("section")?.className).toMatch(/editorial/);
    rerender(<IntroSection title="Заголовок" body="Текст" spacing="compact" />);
    const section = container.querySelector("section");
    expect(section?.className).toMatch(/compact/);
    expect(section?.className).not.toMatch(/editorial/);
    expect(container.querySelector("h2")?.textContent).toBe("Заголовок");
  });

  it("UT-SC-12/EditorialSplitSection: renders full width without a leftover image column when image is omitted", () => {
    const { container, rerender } = render(<EditorialSplitSection title="Природа рядом" body="Текст" image={{ src: "/club.jpg", alt: "Территория" }} />);
    const splitWithImage = container.querySelector("section > div > div");
    expect(splitWithImage?.className).not.toMatch(/splitFullWidth/);
    expect(container.querySelector("img")).toBeTruthy();
    rerender(<EditorialSplitSection title="Природа рядом" body="Текст" />);
    const splitFullWidth = container.querySelector("section > div > div");
    expect(splitFullWidth?.className).toMatch(/splitFullWidth/);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("Природа рядом");
  });

  it("omits empty and invalid benefits instead of inventing content", () => {
    const { container, getByRole } = render(<><BenefitsSection items={[]} /><BenefitsSection title="Почему выбирают клуб" items={[{ title: "" }, { title: "Забота", text: "Внимательное отношение" }]} /></>);
    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(getByRole("heading", { name: "Забота" })).toBeTruthy();
  });

  it("localizes price loading, empty, unknown price and retry states", () => {
    const retry = vi.fn();
    const request = vi.fn();
    const { getByRole, rerender, container } = render(<PricesSection mode="lessons" items={[]} state="error" onRetry={retry} onRequest={request} />);
    fireEvent.click(getByRole("button", { name: "Повторить" }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<PricesSection mode="lessons" items={[]} state="empty" onRequest={request} />);
    expect(container.textContent).toContain("Стоимость уточняется");
    fireEvent.click(getByRole("button", { name: "Уточнить стоимость" }));
    expect(request).toHaveBeenCalledOnce();
    rerender(<PricesSection mode="lessons" items={[{ name: "Занятие", price_tables: [] }]} onRequest={request} />);
    expect(container.textContent).toContain("Стоимость уточняется");
    expect(container.textContent).not.toContain("0 ₽");
  });

  it("UT-SC-09: PricesSection never renders the removed price-variability notice", () => {
    const request = vi.fn();
    const { container, rerender } = render(<PricesSection mode="lessons" items={[{ name: "Занятие", price_tables: [] }]} onRequest={request} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    rerender(<PricesSection mode="lessons" items={[]} state="empty" onRequest={request} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
    rerender(<PricesSection mode="lessons" items={[]} state="error" onRequest={request} />);
    expect(container.textContent).not.toMatch(/переменны|нескольких источников/i);
  });

  it("covers horse and news loading, empty and success variants", () => {
    const { container, rerender, getByRole } = render(<HorsesSection horses={[]} mode="grid" ctaLabel="Записаться" state="loading" onRequest={vi.fn()} onToggle={vi.fn()} />);
    expect(getByRole("status", { name: "Загрузка лошадей" })).toBeTruthy();
    rerender(<HorsesSection horses={[]} mode="grid" ctaLabel="Записаться" state="empty" onRequest={vi.fn()} onToggle={vi.fn()} />);
    expect(container.textContent).toContain("Скоро познакомим вас с лошадьми клуба");
    rerender(<NewsSection items={[]} total={0} mode="archive" state="empty" onOpen={vi.fn()} />);
    expect(container.textContent).toContain("Новостей пока нет");
    rerender(<NewsSection items={[{ id: 1, name: "Осенний праздник", published_at: "2026-09-01" }]} total={1} mode="latest" onOpen={vi.fn()} />);
    expect(container.querySelector("time")?.textContent).toBe("2026-09-01");
  });

  it("collapses optional contacts and map while retaining address and callback context", () => {
    const request = vi.fn();
    const { container, getByRole } = render(<ContactSection address="Московская область, очень длинный адрес клуба" socialLinks={[]} ctaLabel="Связаться" context="О клубе" onRequest={request} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("address")?.textContent).toContain("Московская область");
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    fireEvent.click(getByRole("button", { name: "Связаться" }));
    expect(request).toHaveBeenCalledWith("О клубе");
  });

  it("forwards trimBottom to the underlying Section so a contacts block can sit flush against the footer", () => {
    const { container } = render(<ContactSection trimBottom address="Адрес клуба" socialLinks={[]} ctaLabel="Связаться" context="Главная" onRequest={vi.fn()} />);
    expect(container.querySelector("section")?.className).toMatch(/trimBottom/);
  });

  it("renders semantic information lists and a stable privacy fallback anchor", () => {
    const blocks = [{ title: "Перед поездкой", items: ["Уточните время", "", "Возьмите удобную одежду"] }, { title: "", body: "Нельзя публиковать" }];
    const { container, getByRole } = render(<><PreparationSafetySection blocks={blocks} verifiedOnly /><ConditionsSection blocks={[]} /><PrivacySection /></>);
    expect(getByRole("heading", { name: "Подготовка и безопасность" })).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("#privacy")).toBeTruthy();
    expect(container.textContent).toContain("Имя, телефон и комментарий");
    expect(container.textContent).not.toContain("Нельзя публиковать");
  });
});
