import { normalizePolicyUrl } from "./policyUrl";
import { siteSettingList } from "@/api/siteSettings";
import type { SiteSettingMiniOutDto } from "@/types/siteSettings";

export const SITE_ROUTES = [
  { href: "/", label: "Главная" },
  { href: "/uslugi/zanyatiya", label: "Занятия" },
  { href: "/uslugi/progulki", label: "Прогулки" },
  { href: "/uslugi/postoy", label: "Постой" },
  { href: "/loshadi", label: "Лошади" },
  { href: "/novosti", label: "Новости" },
  { href: "/about", label: "О клубе" },
] as const;
export type SiteMenuItem = { href: string; label: string };
export type SiteSocialLink = { type: "vk" | "instagram"; label: string; href: string };
export type SharedSiteSettings = {
  shortName: string; menu: SiteMenuItem[]; headerPhone?: string; headerCtaLabel: string;
  footerDescription?: string; copyrightName: string; address?: string; phone?: string;
  workingHours?: string; mapsUrl?: string; socialLinks: SiteSocialLink[];
  callback: { title: string; description?: string; submitLabel: string; successMessage: string; consentText: string; policyUrl: string };
  seo: { defaultTitle: string; defaultDescription?: string };
};
export const SHARED_SETTING_KEYS = [
  "site.short_name", "header.menu", "header.contact_phone", "header.cta_label",
  "footer.description", "footer.copyright_name", "contacts.address", "contacts.primary_phone",
  "contacts.working_hours", "contacts.maps_url", "social.vk_url", "social.instagram_url",
  "callback.title", "callback.description", "callback.submit_label", "callback.success_message",
  "callback.consent_text", "callback.policy_url", "seo.default_title", "seo.default_description",
] as const;
export const FALLBACK_SHARED_SETTINGS: SharedSiteSettings = {
  shortName: "ИНЛав", menu: SITE_ROUTES.map((item) => ({ ...item })), headerCtaLabel: "Записаться",
  copyrightName: "Конный клуб «ИНЛав»", socialLinks: [],
  callback: { title: "Записаться в клуб", submitLabel: "Отправить", successMessage: "Спасибо! Мы скоро свяжемся с вами.", consentText: "Я соглашаюсь с политикой обработки персональных данных", policyUrl: "" },
  seo: { defaultTitle: "Конный клуб «ИНЛав»" },
};
function stringValue(item: SiteSettingMiniOutDto | undefined): string | undefined {
  if (!item || item.type !== "string" || typeof item.value !== "string") return undefined;
  return item.value.trim() || undefined;
}
function objectValue(item: SiteSettingMiniOutDto | undefined): unknown {
  if (!item || item.type !== "object") return undefined;
  try { return JSON.parse(item.value); } catch { return undefined; }
}
export function normalizeSharedSettings(items: SiteSettingMiniOutDto[]): SharedSiteSettings {
  const values = new Map(items.map((item) => [item.key, item]));
  const text = (key: string) => stringValue(values.get(key));
  const allowed = new Set<string>(SITE_ROUTES.map(({ href }) => href));
  const configuredMenu = objectValue(values.get("header.menu"));
  const menu = Array.isArray(configuredMenu) ? configuredMenu.flatMap((entry): SiteMenuItem[] => {
    if (!entry || typeof entry !== "object") return [];
    const { href, label } = entry as Record<string, unknown>;
    return typeof href === "string" && allowed.has(href) && typeof label === "string" && label.trim() ? [{ href, label: label.trim() }] : [];
  }).filter((item, index, all) => all.findIndex(({ href }) => href === item.href) === index) : [];
  const vk = text("social.vk_url"); const instagram = text("social.instagram_url"); const phone = text("contacts.primary_phone");
  return {
    shortName: text("site.short_name") ?? FALLBACK_SHARED_SETTINGS.shortName,
    menu: menu.length ? menu : FALLBACK_SHARED_SETTINGS.menu.map((item) => ({ ...item })),
    headerPhone: text("header.contact_phone") ?? phone,
    headerCtaLabel: text("header.cta_label") ?? FALLBACK_SHARED_SETTINGS.headerCtaLabel,
    footerDescription: text("footer.description"),
    copyrightName: text("footer.copyright_name") ?? FALLBACK_SHARED_SETTINGS.copyrightName,
    address: text("contacts.address"), phone, workingHours: text("contacts.working_hours"), mapsUrl: text("contacts.maps_url"),
    socialLinks: [
      ...(vk ? [{ type: "vk" as const, label: "VK", href: vk }] : []),
      ...(instagram ? [{ type: "instagram" as const, label: "Instagram", href: instagram }] : []),
    ],
    callback: {
      title: text("callback.title") ?? FALLBACK_SHARED_SETTINGS.callback.title,
      description: text("callback.description"),
      submitLabel: text("callback.submit_label") ?? FALLBACK_SHARED_SETTINGS.callback.submitLabel,
      successMessage: text("callback.success_message") ?? FALLBACK_SHARED_SETTINGS.callback.successMessage,
      consentText: text("callback.consent_text") ?? FALLBACK_SHARED_SETTINGS.callback.consentText,
      policyUrl: normalizePolicyUrl(text("callback.policy_url")),
    },
    seo: { defaultTitle: text("seo.default_title") ?? FALLBACK_SHARED_SETTINGS.seo.defaultTitle, defaultDescription: text("seo.default_description") },
  };
}
export async function getSiteSettings(): Promise<SharedSiteSettings> {
  const response = await siteSettingList({ key: [...SHARED_SETTING_KEYS] });
  return response.status === "ok" && Array.isArray(response.data) ? normalizeSharedSettings(response.data) : normalizeSharedSettings([]);
}
