"use client";

import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "../atoms";
import styles from "./controls.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "small" | "medium" | "large"; href?: string; loading?: boolean; fallbackLabel?: string };
export function Button({ variant = "primary", size = "medium", href, loading = false, disabled = false, children, fallbackLabel = "Продолжить", className = "", type = "button", ...props }: ButtonProps) {
  const label = typeof children === "string" && !children.trim() ? fallbackLabel : (children ?? fallbackLabel);
  const content = <>{loading ? <span className={styles.spinner} aria-hidden="true" /> : null}<span>{label}</span>{variant === "ghost" ? <span className={styles.arrow}><Icon name="arrow-right" decorative /></span> : null}</>;
  const classes = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`.trim();
  if (href) return <a className={classes} href={disabled || loading ? undefined : href} aria-disabled={disabled || loading || undefined} aria-busy={loading || undefined}>{content}</a>;
  return <button className={classes} type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{content}</button>;
}
export function TextLink({ href, children, fallbackLabel = "Подробнее", className = "" }: { href: string; children?: ReactNode; fallbackLabel?: string; className?: string }) {
  const label = typeof children === "string" && !children.trim() ? fallbackLabel : (children ?? fallbackLabel);
  return <a className={`${styles.textLink} ${className}`.trim()} href={href}>{label}<Icon name="arrow-right" decorative size={16} /></a>;
}

type SharedFieldProps = { id: string; label: string; error?: string; required?: boolean };
function FieldShell({ id, label, error, required, children }: SharedFieldProps & { children: ReactNode }) {
  return <div className={styles.field}><label className={styles.label} htmlFor={id}>{label}<span className={styles.required} aria-hidden="true">{required ? " *" : ""}</span></label>{children}{error ? <p className={styles.error} id={`${id}-error`}>{error}</p> : null}</div>;
}
export function Field({ id, label, error, required, className = "", ...props }: SharedFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return <FieldShell id={id} label={label} error={error} required={required}><input id={id} required={required} className={`${styles.control} ${className}`.trim()} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} /></FieldShell>;
}
export function TextArea({ id, label, error, required, className = "", ...props }: SharedFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <FieldShell id={id} label={label} error={error} required={required}><textarea id={id} required={required} className={`${styles.control} ${styles.textarea} ${className}`.trim()} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} /></FieldShell>;
}
export function NativeSelect({ id, label, error, required, className = "", children, ...props }: SharedFieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return <FieldShell id={id} label={label} error={error} required={required}><span className={styles.selectWrap}><select id={id} required={required} className={`${styles.control} ${styles.select} ${className}`.trim()} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}>{children}</select><span className={styles.selectIcon}><Icon name="chevron-down" decorative size={20} /></span></span></FieldShell>;
}
export type AccordionItem = { id: string; title: string; content: ReactNode };
export function Accordion({ items, allowMultiple = false }: { items: AccordionItem[]; allowMultiple?: boolean }) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  if (!items.length) return null;
  const toggle = (id: string) => setOpenIds((current) => current.includes(id) ? current.filter((item) => item !== id) : allowMultiple ? [...current, id] : [id]);
  return <div className={styles.accordion}>{items.map((item) => { const open = openIds.includes(item.id); const buttonId = `accordion-${item.id}`; const panelId = `${buttonId}-panel`; return <div className={styles.accordionItem} key={item.id}><button id={buttonId} className={styles.accordionButton} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(item.id)}><span className={styles.accordionTitle}>{item.title}</span><span className={`${styles.accordionIcon} ${open ? styles.open : ""}`}><Icon name="plus" decorative /></span></button>{open ? <div className={styles.panel} id={panelId} role="region" aria-labelledby={buttonId}>{item.content}</div> : null}</div>; })}</div>;
}
export function PaginationLoadMore({ page, loaded, total, pending, error, onLoadMore, label = "Показать ещё" }: { page: number; loaded: number; total: number; pending?: boolean; error?: string; onLoadMore: (nextPage: number) => void; label?: string }) {
  const liveId = useId();
  if (loaded >= total) return null;
  return <div className={styles.pagination}><Button loading={pending} disabled={pending} onClick={() => onLoadMore(page + 1)}>{label}</Button><p id={liveId} className={`${styles.status} ${error ? styles.paginationError : ""}`} role={error ? "alert" : undefined} aria-live={error ? undefined : "polite"}>{error || `Показано ${loaded} из ${total}`}</p></div>;
}
