import type { ReactNode } from "react";
import { Button } from "../controls";
import styles from "./feedback.module.css";

type Tone = "success" | "error" | "info";
type NoticeProps = { tone?: Tone; title?: string; message: string; action?: ReactNode };

function FeedbackBody({ title, message, action }: NoticeProps) {
  return <>{title?.trim() ? <strong className={styles.title}>{title}</strong> : null}<span>{message}</span>{action ? <span className={styles.action}>{action}</span> : null}</>;
}

export function Toast(props: NoticeProps) {
  return <div className={`${styles.toast} ${styles[props.tone ?? "info"]}`} role={props.tone === "error" ? "alert" : "status"} aria-live={props.tone === "error" ? "assertive" : "polite"}><FeedbackBody {...props} /></div>;
}

export function InlineNotice(props: NoticeProps) {
  return <div className={`${styles.notice} ${styles[props.tone ?? "info"]}`} role={props.tone === "error" ? "alert" : "status"}><FeedbackBody {...props} /></div>;
}

export function Skeleton({ variant = "card", count = 1, label = "Загрузка" }: { variant?: "text" | "card" | "media"; count?: number; label?: string }) {
  const safeCount = Math.max(1, Math.min(count, 12));
  return <div className={styles.skeletonGroup} role="status" aria-label={label}>{Array.from({ length: safeCount }, (_, index) => <span key={index} aria-hidden="true" className={`${styles.skeleton} ${styles[`skeleton-${variant}`]}`} />)}</div>;
}

export function ErrorBlock({ title = "Не удалось загрузить данные", message, onRetry, retryLabel = "Повторить" }: { title?: string; message: string; onRetry?: () => void; retryLabel?: string }) {
  return <div className={`${styles.stateBlock} ${styles.error}`} role="alert"><strong className={styles.title}>{title}</strong><p>{message}</p>{onRetry ? <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button> : null}</div>;
}

export function EmptyState({ title = "Пока ничего нет", message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return <div className={styles.stateBlock}><strong className={styles.title}>{title}</strong>{message?.trim() ? <p>{message}</p> : null}{action ? <div className={styles.action}>{action}</div> : null}</div>;
}
