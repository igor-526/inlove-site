import { siteSettingList } from "@/api/siteSettings";
import type { SiteSettingMiniOutDto } from "@/types/siteSettings";
import { SITE_CONSUMER_CONFIG, type SiteMenuItem } from "../config";

export type SiteSocialLink = { type: "vk" | "instagram"; label: string; href: string };
export type ContactHoursRange = { start: string; stop: string };
export type SharedSiteSettings = {
  shortName: string; menu: SiteMenuItem[]; headerCtaLabel: string;
  footerDescription?: string; copyrightName: string; address?: string; phone?: string;
  mapLatitude?: number; mapLongitude?: number; mapUrl?: string; nearestStop?: string;
  weekdayHours?: ContactHoursRange; weekendHours?: ContactHoursRange;
  socialLinks: SiteSocialLink[];
  callback: { title: string; description?: string; submitLabel: string; successMessage: string; consentText: string; policyUrl: string };
  seo: { defaultTitle: string; defaultDescription?: string };
};

export const SHARED_SETTING_KEYS = [
  "footer.description", "footer.copyright_name", "contacts.address", "contacts.primary_phone",
  "contacts.map.latitude", "contacts.map.longitude", "contacts.map.url", "contacts.nearest_stop",
  "contacts.hours.weekdays.start", "contacts.hours.weekdays.stop",
  "contacts.hours.weekend.start", "contacts.hours.weekend.stop",
  "social.vk_url", "social.instagram_url",
] as const;
export const FALLBACK_SHARED_SETTINGS: SharedSiteSettings = {
  shortName: SITE_CONSUMER_CONFIG.shortName, menu: [...SITE_CONSUMER_CONFIG.menu],
  headerCtaLabel: SITE_CONSUMER_CONFIG.headerCtaLabel, copyrightName: SITE_CONSUMER_CONFIG.copyrightName,
  socialLinks: [], callback: { ...SITE_CONSUMER_CONFIG.callback },
  seo: { defaultTitle: SITE_CONSUMER_CONFIG.seo.defaultTitle, defaultDescription: SITE_CONSUMER_CONFIG.seo.defaultDescription },
};
function stringValue(item: SiteSettingMiniOutDto | undefined): string | undefined {
  if (!item || item.type !== "string" || typeof item.value !== "string") return undefined;
  return item.value.trim() || undefined;
}
function numberValue(item: SiteSettingMiniOutDto | undefined): number | undefined {
  if (!item || item.type !== "float" || typeof item.value !== "string") return undefined;
  const trimmed = item.value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function timeValue(item: SiteSettingMiniOutDto | undefined): string | undefined {
  if (!item || item.type !== "time" || typeof item.value !== "string") return undefined;
  return item.value.trim() || undefined;
}
function hoursRange(start: string | undefined, stop: string | undefined): ContactHoursRange | undefined {
  return start && stop ? { start, stop } : undefined;
}
export function normalizeSharedSettings(items: SiteSettingMiniOutDto[]): SharedSiteSettings {
  const values = new Map(items.map((item) => [item.key, item]));
  const text = (key: string) => stringValue(values.get(key));
  const time = (key: string) => timeValue(values.get(key));
  const vk = text("social.vk_url"); const instagram = text("social.instagram_url");
  return {
    ...FALLBACK_SHARED_SETTINGS, menu: FALLBACK_SHARED_SETTINGS.menu.map((item) => ({ ...item })),
    footerDescription: text("footer.description"), copyrightName: text("footer.copyright_name") ?? FALLBACK_SHARED_SETTINGS.copyrightName,
    address: text("contacts.address"), phone: text("contacts.primary_phone"),
    mapLatitude: numberValue(values.get("contacts.map.latitude")), mapLongitude: numberValue(values.get("contacts.map.longitude")),
    mapUrl: text("contacts.map.url"), nearestStop: text("contacts.nearest_stop"),
    weekdayHours: hoursRange(time("contacts.hours.weekdays.start"), time("contacts.hours.weekdays.stop")),
    weekendHours: hoursRange(time("contacts.hours.weekend.start"), time("contacts.hours.weekend.stop")),
    socialLinks: [...(vk ? [{ type: "vk" as const, label: "VK", href: vk }] : []), ...(instagram ? [{ type: "instagram" as const, label: "Instagram", href: instagram }] : [])],
  };
}
export async function getSiteSettings(): Promise<SharedSiteSettings> {
  const response = await siteSettingList({ key: [...SHARED_SETTING_KEYS] });
  return response.status === "ok" && Array.isArray(response.data) ? normalizeSharedSettings(response.data) : normalizeSharedSettings([]);
}
