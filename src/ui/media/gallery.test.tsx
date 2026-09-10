// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Gallery } from "./index";

const items = [
  { src: "/one.jpg", alt: "Манеж" },
  { src: "/two.jpg", alt: "Конюшня" },
  { src: "/three.jpg", alt: "Плац" },
];

describe("NOTE-05 mobile gallery interaction", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({ matches: false }) });
  });

  afterEach(cleanup);

  it("keeps every thumbnail in server-rendered markup", () => {
    const html = renderToStaticMarkup(<Gallery items={items} />);
    expect(html.match(/<img/g)).toHaveLength(3);
    expect(html).toContain("Манеж");
    expect(html).toContain("Конюшня");
    expect(html).toContain("Плац");
  });

  it("moves through thumbnails with arrow keys and keeps focus on the gallery", () => {
    const view = render(<Gallery items={items} />);
    const gallery = view.getByRole("region", { name: "Галерея фотографий" });
    gallery.focus();
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "nearest", inline: "start" });
    expect(view.getByText("Изображение 2 из 3")).toBeTruthy();
    expect(document.activeElement).toBe(gallery);
  });

  it("uses instant programmatic movement when reduced motion is requested", () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const view = render(<Gallery items={items} />);
    fireEvent.keyDown(view.getByRole("region", { name: "Галерея фотографий" }), { key: "ArrowRight" });
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "auto", block: "nearest", inline: "start" });
  });

  it("announces the nearest thumbnail after native touch scrolling", () => {
    const view = render(<Gallery items={items} />);
    const gallery = view.getByRole("region", { name: "Галерея фотографий" });
    Object.defineProperty(gallery, "scrollLeft", { configurable: true, value: 330 });
    Array.from(gallery.children).forEach((child, index) => Object.defineProperty(child, "offsetLeft", { configurable: true, value: index * 330 }));
    fireEvent.scroll(gallery);
    expect(view.getByText("Изображение 2 из 3")).toBeTruthy();
  });
});
