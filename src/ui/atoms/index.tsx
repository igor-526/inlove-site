"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import styles from "./atoms.module.css";

export const INLOVE_LOGO_ASSET = "/images/inlove-logo.jpg";

export function Logo({ variant = "dark", shortName, asset = INLOVE_LOGO_ASSET }: { variant?: "light" | "dark"; shortName?: string; asset?: string }) {
  const [failed, setFailed] = useState(false);
  const label = shortName?.trim() || "ИНЛав";
  return <Link href="/" aria-label={`${label} — на главную`} className={`${styles.logo} ${styles[variant]}`}>
    {asset && !failed ? <img className={styles.logoImage} src={asset} alt="" onError={() => setFailed(true)} /> : <span className={styles.logoText}>{label}</span>}
  </Link>;
}

type IconName = "arrow-right" | "chevron-down" | "chevron-right" | "close" | "instagram" | "menu" | "phone" | "plus" | "vk";
const paths: Record<IconName, ReactNode> = {
  "arrow-right": <><path d="M4 12h16"/><path d="m14 6 6 6-6 6"/></>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>, "chevron-right": <path d="m9 6 6 6-6 6"/>,
  close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>, menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/></>,
  phone: <path d="M8 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-4l-5-2-2 3a15 15 0 0 1-7-7l3-2-2-5Z"/>, plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  vk: <path d="M3 6c1 7 5 12 10 12V6M13 12c3 0 5-3 7-6M13 12c3 0 6 3 8 6"/>,
};
export function Icon({ name, size = 20, decorative = true, label }: { name: IconName; size?: 16 | 20 | 24 | 28 | 32; decorative?: boolean; label?: string }) {
  const aria = decorative ? { "aria-hidden": true as const } : { role: "img", "aria-label": label || name };
  return <svg className={styles.icon} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false" {...aria}>{paths[name]}</svg>;
}
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "nature" | "dark"; children?: string }) {
  if (!children?.trim()) return null;
  return <span className={`${styles.badge} ${tone === "dark" ? styles.badgeDark : styles[tone]}`}>{children}</span>;
}
export function ResponsiveImage({ src, alt = "", ratio, focalPoint = "50% 50%", priority = false }: { src?: string; alt?: string; ratio: "hero" | "4:5" | "3:4" | "16:10" | "3:2"; focalPoint?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ratioClass = { hero: styles.hero, "4:5": styles.ratio45, "3:4": styles.ratio34, "16:10": styles.ratio1610, "3:2": styles.ratio32 }[ratio];
  return <span className={`${styles.imageFrame} ${ratioClass}`}>{src && !failed ? <img className={styles.image} src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} sizes="(max-width: 767px) 100vw, (max-width: 1360px) 50vw, 680px" style={{ objectPosition: focalPoint } as CSSProperties} onError={() => setFailed(true)} /> : <span className={styles.fallback} role={alt ? "img" : undefined} aria-label={alt || undefined}>{alt ? "Изображение недоступно" : null}</span>}</span>;
}
export function SectionLabel({ text }: { text?: string }) { return text?.trim() ? <span className={styles.sectionLabel}>{text}</span> : null; }
export function Divider({ tone = "default" }: { tone?: "default" | "strong" | "inverse" }) { return <hr aria-hidden="true" className={`${styles.divider} ${tone === "strong" ? styles.dividerStrong : tone === "inverse" ? styles.dividerInverse : ""}`} />; }
export function PriceValue({ value, duration }: { value?: string | number | null; duration?: string }) {
  const unknown = value === null || value === undefined || value === "";
  const formatted = unknown ? "Стоимость уточняется" : typeof value === "number" ? `${new Intl.NumberFormat("ru-RU").format(value)}\u00a0₽` : value;
  return <span className={styles.price} aria-label={duration ? `${formatted}, ${duration}` : String(formatted)}><span>{formatted}</span>{duration?.trim() ? <span className={styles.duration}>{duration}</span> : null}</span>;
}
