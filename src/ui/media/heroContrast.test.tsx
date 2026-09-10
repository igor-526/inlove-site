// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroMedia } from "./index";

describe("NOTE-04 hero typography and contrast", () => {
  it("renders the same readable copy contract with photo and fallback media", () => {
    const photo = render(<HeroMedia image={{ src: "/images/070-home-hero.jpg", alt: "Клуб" }} title="Конный клуб" subtitle="Приезжайте знакомиться" />);
    expect(photo.getByRole("heading", { level: 1 }).textContent).toBe("Конный клуб");
    expect(photo.getByText("Приезжайте знакомиться")).toBeTruthy();
    photo.unmount();

    const fallback = render(<HeroMedia image={{ alt: "Клуб" }} title="Конный клуб" subtitle="Приезжайте знакомиться" />);
    expect(fallback.getByRole("img", { name: "Клуб" }).textContent).toBe("Изображение недоступно");
    expect(fallback.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("defines a dark fallback and stronger overlays for desktop and narrow screens", () => {
    const css = readFileSync(`${process.cwd()}/src/ui/media/media.module.css`, "utf8");
    expect(css).toContain(".heroImage>span>span{color:var(--color-text-inverse);background:var(--color-bg-dark)}");
    expect(css).toContain("rgba(18,25,21,.72)");
    expect(css).toContain("rgba(13,18,15,.42)");
    expect(css).toContain("rgba(18,25,21,.76)");
    expect(css).toContain("rgba(18,25,21,.6)");
  });
});
