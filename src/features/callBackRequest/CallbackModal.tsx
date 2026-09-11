"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button, Field, TextArea } from "@/ui/controls";
import { normalizePolicyUrl } from "@/features/siteSettings/services/policyUrl";
import { useSiteSettings } from "@/features/siteSettings";
import { CallBackRequestError, sendCallBackRequest } from "./services/sendCallBackRequest";
import { appendCallbackContext, callbackFormSchema, composedCallbackCommentSchema, formatCallbackContext, type CallbackContext, type CallbackFormValues } from "./schema";
import styles from "./callbackModal.module.css";

type Errors = Partial<Record<keyof CallbackFormValues | "form", string>>;
const EMPTY_VALUES = { name: "", comment: "", consent: false } as const;
type ControlledValues = { name: string; comment: string; consent: boolean };

export function CallbackModal({ open, context, onClose }: { open: boolean; context: CallbackContext; onClose: () => void }) {
  const { callback } = useSiteSettings();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [values, setValues] = useState<ControlledValues>({ ...EMPTY_VALUES });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "pending" | "success">("idle");

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.callbackOpen = "true";
    queueMicrotask(() => dialogRef.current?.querySelector<HTMLElement>("button, input, textarea, a[href]")?.focus());
    return () => {
      document.body.style.overflow = oldOverflow;
      delete document.body.dataset.callbackOpen;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (state !== "pending") onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]") ?? [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const focusFirstError = (fieldErrors: Errors) => {
    const first = (["name", "phone", "comment", "consent"] as const).find((key) => fieldErrors[key]);
    if (first) queueMicrotask(() => document.getElementById(`callback-${first}`)?.focus());
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state === "pending") return;
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const submittedValues = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      comment: String(formData.get("comment") ?? ""),
      consent: formData.has("consent"),
    };
    const result = callbackFormSchema.safeParse(submittedValues);
    if (!result.success) {
      const nextErrors: Errors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof CallbackFormValues] ??= issue.message;
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    const comment = appendCallbackContext(result.data.comment, context);
    const composedComment = composedCallbackCommentSchema.safeParse(comment);
    if (!composedComment.success) {
      const nextErrors: Errors = { comment: composedComment.error.issues[0]?.message };
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    setErrors({});
    setState("pending");
    try {
      await sendCallBackRequest({ ...(result.data.name ? { name: result.data.name } : {}), phone: result.data.phone, ...(composedComment.data ? { comment: composedComment.data } : {}) });
      setState("success");
    } catch (error) {
      setState("idle");
      const status = error instanceof CallBackRequestError ? error.statusCode : undefined;
      if (status === 400 || status === 422) setErrors({ phone: "Проверьте введённые данные и попробуйте снова" });
      else if (status === 401) setErrors({ form: "Форма временно недоступна из-за настройки сайта. Позвоните нам или попробуйте позже." });
      else setErrors({ form: "Не удалось отправить заявку. Проверьте соединение и попробуйте снова." });
    }
  };

  const contextText = formatCallbackContext(context);
  const policyUrl = normalizePolicyUrl(callback.policyUrl);
  return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={onKeyDown}>
      <button className={styles.close} type="button" aria-label="Закрыть форму" onClick={close} disabled={state === "pending"}>×</button>
      <h2 id={titleId}>{callback.title}</h2>
      <p id={descriptionId} className={styles.description}>{callback.description || "Оставьте контакты, и мы свяжемся с вами."}</p>
      {state === "success" ? <div className={styles.success} role="status"><p>{callback.successMessage}</p><Button onClick={close}>Закрыть</Button></div> :
        <form className={styles.form} onSubmit={submit} noValidate aria-busy={state === "pending"}>
          {contextText ? <p className={styles.context}>{contextText}</p> : null}
          <Field id="callback-name" name="name" label="Имя" value={values.name} maxLength={127} disabled={state === "pending"} error={errors.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
          <Field id="callback-phone" name="phone" label="Телефон" type="tel" autoComplete="tel" required defaultValue="" maxLength={63} disabled={state === "pending"} error={errors.phone} />
          <TextArea id="callback-comment" name="comment" label="Комментарий" value={values.comment} maxLength={2000} disabled={state === "pending"} error={errors.comment} onChange={(e) => setValues((v) => ({ ...v, comment: e.target.value }))} />
          <div className={styles.consent}>
            <input id="callback-consent" name="consent" type="checkbox" checked={values.consent} disabled={state === "pending"} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "callback-consent-error" : undefined} onChange={(e) => setValues((v) => ({ ...v, consent: e.target.checked }))} />
            <label htmlFor="callback-consent">{callback.consentText} {policyUrl ? <a href={policyUrl}>Политика</a> : null}</label>
            {errors.consent ? <p id="callback-consent-error" className={styles.error}>{errors.consent}</p> : null}
          </div>
          {errors.form ? <p className={styles.formError} role="alert">{errors.form}</p> : null}
          <Button type="submit" loading={state === "pending"} disabled={state === "pending"}>{state === "pending" ? "Отправляем…" : callback.submitLabel}</Button>
        </form>}
    </div>
  </div>;
}
