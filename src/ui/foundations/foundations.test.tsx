// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageContainer, Section, Text } from "./index";

describe("CT-ILUI-01 foundations", () => {
  it("keeps visual variants independent from heading semantics", () => {
    const { container } = render(<Section headingId="title" label="Очень длинная редакционная подпись без обрезки"><PageContainer size="wide"><Text as="h2" id="title" variant="display-xl">Заголовок</Text><Text as="span" variant="h3">Не заголовок</Text></PageContainer></Section>);
    expect(container.querySelector("section")?.getAttribute("aria-labelledby")).toBe("title");
    expect(container.querySelector("h2")?.textContent).toBe("Заголовок");
    expect(container.querySelectorAll("h3")).toHaveLength(0);
    expect(container.textContent).toContain("Очень длинная редакционная подпись без обрезки");
  });

  it("omits empty optional content and defines semantic and reduced-motion tokens", () => {
    const { container } = render(<><Text as="span">{"​".replace("​", "")}</Text><Section>{null}</Section></>);
    expect(container.childElementCount).toBe(0);
    const tokens = readFileSync(`${process.cwd()}/src/ui/foundations/tokens.css`, "utf8");
    const globals = readFileSync(`${process.cwd()}/src/app/globals.css`, "utf8");
    expect(tokens).toContain("--color-brand-primary");
    expect(tokens).toContain("--font-serif");
    expect(tokens).toContain("--breakpoint-lg");
    expect(globals).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps font stacks valid outside the Next font variable scope and muted text AA-safe", () => {
    const tokens = readFileSync(`${process.cwd()}/src/ui/foundations/tokens.css`, "utf8");
    expect(tokens).toContain('var(--font-cormorant, "Cormorant Garamond")');
    expect(tokens).toContain("var(--font-manrope, Manrope)");
    expect(tokens).toContain("--color-text-muted: var(--color-text-secondary)");
    expect(tokens).toMatch(/--text-display-xl-size:\s*72px/);
    expect(tokens).toMatch(/max-width:\s*1279px[\s\S]*--text-display-xl-size:\s*60px/);
    expect(tokens).toMatch(/max-width:\s*375\.98px[\s\S]*--text-display-xl-size:\s*38px/);
  });
});
