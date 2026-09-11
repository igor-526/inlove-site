import { z } from "zod";

export const CALLBACK_NAME_MAX_LENGTH = 127;
export const CALLBACK_PHONE_MAX_LENGTH = 63;
export const CALLBACK_COMMENT_MAX_LENGTH = 2000;
export const CALLBACK_COMMENT_MAX_ERROR = "Комментарий с выбранным контекстом не должен превышать 2000 символов";

const optionalTrimmedString = (maxLength: number, message: string) => z.string()
  .trim()
  .max(maxLength, message)
  .transform((value) => value || undefined);

export const callbackFormSchema = z.object({
  name: optionalTrimmedString(CALLBACK_NAME_MAX_LENGTH, "Имя не должно превышать 127 символов"),
  phone: z.string().trim().min(1, "Укажите телефон").max(CALLBACK_PHONE_MAX_LENGTH, "Телефон не должен превышать 63 символа"),
  comment: optionalTrimmedString(CALLBACK_COMMENT_MAX_LENGTH, "Комментарий не должен превышать 2000 символов"),
  consent: z.literal(true, { error: "Подтвердите согласие на обработку данных" }),
});

export const composedCallbackCommentSchema = z.string()
  .max(CALLBACK_COMMENT_MAX_LENGTH, CALLBACK_COMMENT_MAX_ERROR)
  .optional();

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

export function appendCallbackContext(comment: string | undefined, context: CallbackContext): string | undefined {
  const contextText = formatCallbackContext(context);
  const cleanComment = comment?.trim() ?? "";
  if (!contextText) return cleanComment || undefined;
  if (!cleanComment) return contextText;
  return `${cleanComment}\n\n${contextText}`;
}
