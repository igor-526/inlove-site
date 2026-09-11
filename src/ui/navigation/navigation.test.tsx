// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_SHARED_SETTINGS } from "@/features/siteSettings";
import { INLOVE_LOGO_ASSET, Logo } from "../atoms";
import { MobileMenu, SiteFooter, SiteHeader } from "./index";

const route = vi.hoisted(() => ({ pathname: "/about" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(() => { cleanup(); route.pathname = "/about"; });

describe("site navigation", () => {
  it("uses compact navigation throughout the tablet range", () => {
    const css = readFileSync(`${process.cwd()}/src/ui/navigation/navigation.module.css`, "utf8");
    expect(css).toMatch(/@media\(max-width:1279px\)\{\.desktopNav,\.desktopCta,\.phone span\{display:none\}\.menuTrigger,\.iconButton\{display:flex\}\}/);
  });

  it("CT-NOTE-SHELL-01 uses one static logo source and text only as failure fallback", () => {
    const { container, rerender } = render(<Logo shortName="ИНЛав" />);
    const link = screen.getByRole("link", { name: "ИНЛав — на главную" });
    expect(link.getAttribute("href")).toBe("/");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(INLOVE_LOGO_ASSET);
    expect(link.textContent).toBe("");
    fireEvent.error(container.querySelector("img")!);
    expect(link.textContent).toBe("ИНЛав");
    rerender(<Logo shortName="" asset="" />);
    expect(screen.getByRole("link", { name: "ИНЛав — на главную" }).textContent).toBe("ИНЛав");
  });

  it("CT-NOTE-SHELL-02 exposes the three-service dropdown, active group and Escape focus return", () => {
    route.pathname = "/uslugi/progulki";
    render(<SiteHeader shortName="ИНЛав" menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} ctaLabel="Записаться" onRequestCallback={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Услуги" });
    expect(trigger.getAttribute("data-active")).toBe("true");
    fireEvent.click(trigger);
    const serviceLinks = ["Занятия", "Прогулки", "Постой"].map((name) => screen.getAllByRole("link", { name })[0]);
    expect(serviceLinks.map((link) => link.getAttribute("href"))).toEqual(["/uslugi/zanyatiya", "/uslugi/progulki", "/uslugi/postoy"]);
    expect(serviceLinks[1].getAttribute("aria-current")).toBe("page");
    serviceLinks[0].focus(); fireEvent.keyDown(serviceLinks[0], { key: "Escape" });
    expect(document.activeElement).toBe(trigger); expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("UT-NAV-01 keeps a continuous pointer bridge and an opaque dropdown surface", () => {
    const css = readFileSync(`${process.cwd()}/src/ui/navigation/navigation.module.css`, "utf8");
    const tokens = readFileSync(`${process.cwd()}/src/ui/foundations/tokens.css`, "utf8");
    expect(css).toMatch(/\.servicesDropdown\{[^}]*top:100%[^}]*padding-top:4px[^}]*z-index:40/);
    expect(css).not.toContain("top:calc(100% + 4px)");
    expect(css).toMatch(/\.servicesDropdownSurface\{[^}]*background:var\(--color-bg-secondary\)[^}]*border:var\(--border-default\)[^}]*box-shadow:var\(--shadow-card\)/);
    expect(tokens).toMatch(/--color-bg-secondary:\s*#[0-9a-f]{6};/i);
    expect(tokens).not.toMatch(/--color-bg-secondary:\s*(?:transparent|#[0-9a-f]{8}\s*;)/i);

    render(<SiteHeader shortName="ИНЛав" menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} ctaLabel="Записаться" onRequestCallback={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Услуги" });
    fireEvent.mouseEnter(trigger.parentElement!);
    expect(screen.getByRole("link", { name: "Занятия" })).toBeTruthy();
    fireEvent.mouseLeave(trigger.parentElement!);
    expect(screen.queryByRole("link", { name: "Занятия" })).toBeNull();
  });

  it("CT-NOTE-SHELL-03 keeps footer grouping aligned and compact with 44px links", () => {
    const { container } = render(<SiteFooter shortName="ИНЛав" menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} copyrightName="ИНЛав" />);
    const footerNav = screen.getByRole("navigation", { name: "Навигация в подвале" });
    expect(within(footerNav).getByText("Услуги")).toBeTruthy();
    expect(["Занятия", "Прогулки", "Постой"].map((name) => within(footerNav).getByRole("link", { name }).getAttribute("href"))).toEqual(["/uslugi/zanyatiya", "/uslugi/progulki", "/uslugi/postoy"]);
    expect(readFileSync(`${process.cwd()}/src/ui/navigation/navigation.module.css`, "utf8")).toContain("min-height:44px");
    expect(container.querySelector(`img[src="${INLOVE_LOGO_ASSET}"]`)).toBeTruthy();
  });

  it("CT-NOTE-SHELL-04 renders shared contact icons, VK label and safe external targets", () => {
    render(<SiteFooter shortName="ИНЛав" menu={[]} address="Адрес" mapsUrl="https://maps.example/" phone="+7 999 000-00-00" workingHours="10–20" socialLinks={[{ type: "vk", label: "ВКонтакте", href: "https://vk.example/" }, { type: "instagram", label: "Instagram", href: "https://instagram.example/" }]} copyrightName="ИНЛав" />);
    expect(screen.getByText("VK")).toBeTruthy(); expect(screen.queryByText("ВКонтакте")).toBeNull();
    const contacts = screen.getByText("Контакты").parentElement!;
    expect(contacts.querySelectorAll("svg[aria-hidden=true]")).toHaveLength(3);
    for (const link of contacts.querySelectorAll("a")) { expect(link.target).toBe("_blank"); expect(link.rel).toBe("noopener noreferrer"); }
  });

  it("UT-NAV-02 keeps mobile focus trap, Escape close and focus return", () => {
    const trigger = document.createElement("button"); document.body.append(trigger); trigger.focus(); const triggerRef = { current: trigger }; const onClose = vi.fn();
    const { rerender } = render(<MobileMenu open menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} ctaLabel="Записаться" shortName="ИНЛав" onClose={onClose} onRequestCallback={vi.fn()} triggerRef={triggerRef} />);
    expect(document.body.style.overflow).toBe("hidden"); fireEvent.keyDown(document, { key: "Escape" }); expect(onClose).toHaveBeenCalledOnce();
    rerender(<MobileMenu open={false} menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} ctaLabel="Записаться" shortName="ИНЛав" onClose={onClose} onRequestCallback={vi.fn()} triggerRef={triggerRef} />);
    expect(document.activeElement).toBe(trigger); expect(document.body.style.overflow).toBe(""); trigger.remove();
  });

  it("UT-NAV-03 portals the mobile overlay to the viewport root and cleans it up", () => {
    const host = document.createElement("header"); document.body.append(host);
    const { rerender } = render(<MobileMenu open menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} ctaLabel="Записаться" shortName="ИНЛав" onClose={vi.fn()} onRequestCallback={vi.fn()} />, { container: host });
    const dialog = screen.getByRole("dialog", { name: "Меню" });
    expect(dialog.parentElement).toBe(document.body);
    expect(host.querySelector("#mobile-menu")).toBeNull();
    rerender(<MobileMenu open={false} menu={FALLBACK_SHARED_SETTINGS.menu} socialLinks={[]} ctaLabel="Записаться" shortName="ИНЛав" onClose={vi.fn()} onRequestCallback={vi.fn()} />);
    expect(screen.queryByRole("dialog", { name: "Меню" })).toBeNull();
    host.remove();
  });

  it("UT-NAV-04 provides dynamic viewport, safe-area and internal-scroll geometry", () => {
    const css = readFileSync(`${process.cwd()}/src/ui/navigation/navigation.module.css`, "utf8");
    expect(css).toMatch(/\.overlay\{[^}]*height:100vh[^}]*min-height:100vh[^}]*env\(safe-area-inset-top\)[^}]*overflow-x:hidden[^}]*overflow-y:auto/);
    expect(css).toContain("@supports(height:100dvh){.overlay{height:100dvh;min-height:100dvh}}");
    expect(css).toContain("min-height:44px");
  });
});
