import type { ElementType, HTMLAttributes, ReactNode } from "react";
import styles from "./foundations.module.css";

export type TextVariant = "display-xl" | "display-l" | "h1" | "h2" | "h3" | "h4" | "body-l" | "body-m" | "body-s" | "label" | "meta" | "price";
const variantClasses: Record<TextVariant, string> = { "display-xl": styles.displayXl, "display-l": styles.displayL, h1: styles.h1, h2: styles.h2, h3: styles.h3, h4: styles.h4, "body-l": styles.bodyL, "body-m": styles.bodyM, "body-s": styles.bodyS, label: styles.label, meta: styles.meta, price: styles.price };
const serifVariants = new Set<TextVariant>(["display-xl", "display-l", "h1", "h2", "h3", "h4"]);

export function PageContainer({ size = "default", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { size?: "default" | "wide" }) {
  return <div className={`${styles.container} ${size === "wide" ? styles.wide : ""} ${className}`.trim()} {...props} />;
}

export function Section({ tone = "ivory", spacing = "default", label, headingId, children, className = "", ...props }: HTMLAttributes<HTMLElement> & { tone?: "ivory" | "surface" | "sage" | "sand" | "forest"; spacing?: "compact" | "default" | "editorial"; label?: string; headingId?: string }) {
  if (!children) return null;
  return <section aria-labelledby={headingId} className={`${styles.section} ${styles[tone]} ${spacing !== "default" ? styles[spacing] : ""} ${className}`.trim()} {...props}>{label?.trim() ? <span className={styles.label}>{label}</span> : null}{children}</section>;
}

export function Text({ as, variant = "body-m", tone = "primary", children, className = "", ...props }: { as?: ElementType; variant?: TextVariant; tone?: "primary" | "secondary" | "muted" | "inverse"; children?: ReactNode; className?: string } & Record<string, unknown>) {
  if (children === null || children === undefined || children === "") return null;
  const Component = as ?? "p";
  return <Component className={`${styles.text} ${variantClasses[variant]} ${serifVariants.has(variant) ? styles.serif : styles.sans} ${styles[tone]} ${className}`.trim()} {...props}>{children}</Component>;
}
