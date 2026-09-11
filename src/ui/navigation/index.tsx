"use client";

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { SiteMenuItem, SiteSocialLink } from "@/features/siteSettings";
import { Logo, Icon } from "../atoms";
import { Button } from "../controls";
import { PageContainer } from "../foundations";
import styles from "./navigation.module.css";

type CallbackTrigger = (source: "header" | "mobile-menu" | "sticky") => void;
const phoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
const SERVICE_ROUTES = new Set(["/uslugi/zanyatiya", "/uslugi/progulki", "/uslugi/postoy"]);
const splitMenu = (menu: SiteMenuItem[]) => ({ services: menu.filter((item) => SERVICE_ROUTES.has(item.href)), primary: menu.filter((item) => !SERVICE_ROUTES.has(item.href)) });

function NavigationLinks({ menu, pathname, onNavigate }: { menu: SiteMenuItem[]; pathname: string; onNavigate?: () => void }) {
  return <>{menu.map((item) => <a key={item.href} href={item.href} onClick={onNavigate} aria-current={pathname === item.href ? "page" : undefined} className={styles.navLink}>{item.label}</a>)}</>;
}

function ServicesDropdown({ items, pathname }: { items: SiteMenuItem[]; pathname: string }) {
  const [open, setOpen] = useState(false); const triggerRef = useRef<HTMLButtonElement>(null); const listRef = useRef<HTMLDivElement>(null);
  const active = items.some((item) => pathname === item.href);
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) triggerRef.current?.focus(); };
  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); requestAnimationFrame(() => listRef.current?.querySelector<HTMLAnchorElement>("a")?.focus()); }
    if (event.key === "Escape") { event.preventDefault(); close(true); }
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); };
  return <div className={styles.servicesMenu} onMouseEnter={() => setOpen(true)} onMouseLeave={() => close()} onBlur={onBlur} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); close(true); } }}>
    <button ref={triggerRef} type="button" className={`${styles.navLink} ${styles.servicesTrigger}`} aria-expanded={open} aria-controls="services-menu" data-active={active || undefined} onClick={() => setOpen((value) => !value)} onKeyDown={onTriggerKeyDown}>Услуги <Icon name="chevron-down" size={16} /></button>
    {open ? <div ref={listRef} id="services-menu" className={styles.servicesDropdown}><div className={styles.servicesDropdownSurface}><NavigationLinks menu={items} pathname={pathname} /></div></div> : null}
  </div>;
}

function DesktopNavigation({ menu, pathname }: { menu: SiteMenuItem[]; pathname: string }) {
  const { primary, services } = splitMenu(menu); const firstServiceIndex = menu.findIndex((item) => SERVICE_ROUTES.has(item.href)); let inserted = false;
  return <>{primary.map((item) => { const dropdownBefore = !inserted && services.length > 0 && menu.findIndex((candidate) => candidate.href === item.href) > firstServiceIndex; if (dropdownBefore) inserted = true; return <span className={styles.navEntry} key={item.href}>{dropdownBefore ? <ServicesDropdown items={services} pathname={pathname} /> : null}<NavigationLinks menu={[item]} pathname={pathname} /></span>; })}{services.length > 0 && !inserted ? <ServicesDropdown items={services} pathname={pathname} /> : null}</>;
}

function GroupedNavigation({ menu, pathname, onNavigate }: { menu: SiteMenuItem[]; pathname: string; onNavigate?: () => void }) {
  const { services } = splitMenu(menu); let inserted = false;
  return <>{menu.map((item) => {
    if (SERVICE_ROUTES.has(item.href)) {
      if (inserted) return null; inserted = true;
      return <div className={styles.groupedServices} key="services"><span>Услуги</span><NavigationLinks menu={services} pathname={pathname} onNavigate={onNavigate} /></div>;
    }
    return <NavigationLinks key={item.href} menu={[item]} pathname={pathname} onNavigate={onNavigate} />;
  })}</>;
}

export function SiteHeader({ shortName, menu, phone, socialLinks, ctaLabel, onRequestCallback }: { shortName: string; menu: SiteMenuItem[]; phone?: string; socialLinks: SiteSocialLink[]; ctaLabel: string; onRequestCallback: CallbackTrigger }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const triggerRef = useRef<HTMLButtonElement>(null);
  return <header className={styles.header}><PageContainer className={styles.headerInner}><Logo shortName={shortName} />
    <nav className={styles.desktopNav} aria-label="Основная навигация"><DesktopNavigation menu={menu} pathname={pathname} /></nav>
    <div className={styles.headerActions}>{phone ? <a className={styles.phone} href={phoneHref(phone)}><Icon name="phone" size={20} /><span>{phone}</span></a> : null}<Button className={styles.desktopCta} onClick={() => onRequestCallback("header")}>{ctaLabel}</Button>
      <button ref={triggerRef} className={styles.menuTrigger} type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label="Открыть меню" onClick={() => setOpen(true)}><Icon name="menu" size={28} /></button></div>
  </PageContainer><MobileMenu open={open} menu={menu} phone={phone} socialLinks={socialLinks} ctaLabel={ctaLabel} shortName={shortName} onClose={() => setOpen(false)} onRequestCallback={onRequestCallback} triggerRef={triggerRef} /></header>;
}

export function MobileMenu({ open, menu, phone, socialLinks, ctaLabel, shortName, onClose, onRequestCallback, triggerRef }: { open: boolean; menu: SiteMenuItem[]; phone?: string; socialLinks: SiteSocialLink[]; ctaLabel: string; shortName: string; onClose: () => void; onRequestCallback: CallbackTrigger; triggerRef?: RefObject<HTMLButtonElement | null> }) {
  const pathname = usePathname(); const panelRef = useRef<HTMLDivElement>(null); const wasOpen = useRef(false);
  useEffect(() => {
    if (!open) { if (wasOpen.current) triggerRef?.current?.focus(); wasOpen.current = false; return; }
    wasOpen.current = true; const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const focusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? []); focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); return; } if (event.key !== "Tab") return; const nodes = focusable(); if (!nodes.length) return; const first = nodes[0]; const last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } };
    document.addEventListener("keydown", onKeyDown); return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [open, onClose, triggerRef]);
  if (!open) return null;
  return createPortal(<div id="mobile-menu" className={styles.overlay} role="dialog" aria-modal="true" aria-label="Меню" ref={panelRef}><div className={styles.mobileTop}><Logo shortName={shortName} /><button className={styles.iconButton} type="button" onClick={onClose} aria-label="Закрыть меню"><Icon name="close" size={28} /></button></div><nav className={styles.mobileNav} aria-label="Мобильная навигация"><GroupedNavigation menu={menu} pathname={pathname} onNavigate={onClose} /></nav><div className={styles.mobileBottom}>{phone ? <a href={phoneHref(phone)}>{phone}</a> : null}<div className={styles.socials}>{socialLinks.map((social) => <a key={social.type} href={social.href} aria-label={social.label}>{social.label}</a>)}</div><Button size="large" onClick={() => { onClose(); onRequestCallback("mobile-menu"); }}>{ctaLabel}</Button></div></div>, document.body);
}

export function SiteFooter({ shortName, description, menu, address, phone, workingHours, mapsUrl, socialLinks, copyrightName }: { shortName: string; description?: string; menu: SiteMenuItem[]; address?: string; phone?: string; workingHours?: string; mapsUrl?: string; socialLinks: SiteSocialLink[]; copyrightName: string }) {
  const pathname = usePathname();
  return <footer className={styles.footer}><PageContainer><div className={styles.footerGrid}><div><Logo variant="light" shortName={shortName} />{description ? <p>{description}</p> : null}</div><nav aria-label="Навигация в подвале"><h2>Разделы</h2><GroupedNavigation menu={menu} pathname={pathname} /></nav>{address || phone || workingHours || socialLinks.length ? <div className={styles.contacts}><h2>Контакты</h2>{address ? mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer">{address}</a> : <p>{address}</p> : null}{phone ? <a href={phoneHref(phone)} target="_blank" rel="noopener noreferrer"><Icon name="phone" size={20} />{phone}</a> : null}{workingHours ? <p>{workingHours}</p> : null}{socialLinks.map((social) => <a key={social.type} href={social.href} target="_blank" rel="noopener noreferrer"><Icon name={social.type === "vk" ? "vk" : "instagram"} size={20} />{social.type === "vk" ? "VK" : social.label}</a>)}</div> : null}</div><div className={styles.legal}>© {new Date().getFullYear()} {copyrightName}</div></PageContainer></footer>;
}

export function StickyMobileCta({ label, visible, onActivate }: { label: string; visible: boolean; onActivate: () => void }) {
  return visible ? <div className={styles.stickyCta}><Button size="large" onClick={onActivate}>{label || "Записаться"}</Button></div> : null;
}
