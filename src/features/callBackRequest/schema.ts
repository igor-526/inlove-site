import { z } from "zod";

export const callbackFormSchema = z.object({
  name: z.string().trim().max(127, "Имя не должно превышать 127 символов"),
  phone: z.string().trim().min(1, "Укажите телефон").max(63, "Телефон не должен превышать 63 символа"),
  comment: z.string().trim().max(2000, "Комментарий не должен превышать 2000 символов"),
  consent: z.literal(true, { error: "Подтвердите согласие на обработку данных" }),
});

export type CallbackFormValues = z.infer<typeof callbackFormSchema>;

export type CallbackContext = {
  route: string;
  serviceName?: string;
  serviceSlug?: string;
  tariffName?: string;
  horseName?: string;
};

export function formatCallbackContext(context: CallbackContext): string {
  const lines = [
    context.serviceName?.trim() ? `Услуга: ${context.serviceName.trim()}` : "",
    context.serviceSlug?.trim() ? `Код услуги: ${context.serviceSlug.trim()}` : "",
    context.tariffName?.trim() ? `Тариф: ${context.tariffName.trim()}` : "",
    context.horseName?.trim() ? `Лошадь: ${context.horseName.trim()}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export function appendCallbackContext(comment: string, context: CallbackContext): string | undefined {
  const contextText = formatCallbackContext(context).slice(0, 2000);
  const cleanComment = comment.trim();
  if (!contextText) return cleanComment || undefined;
  if (!cleanComment) return contextText;
  const availableForComment = Math.max(0, 2000 - contextText.length - 2);
  return `${cleanComment.slice(0, availableForComment)}\n\n${contextText}`.slice(-2000);
}
