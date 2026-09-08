import { siteSettingList } from "@/api/siteSettings";
import type { SiteSettingMiniOutDto } from "@/types/siteSettings";

export interface SiteSettings {
  address?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  phone?: string;
  siteName?: string;
  weekdayHours?: string;
  weekendHours?: string;
  vk?: string;
  mail?: string;
  socials: Array<{ label: string; href: string; type: "vk" | "mail" }>;
  pricePlus?: number;
  getSetting: (key: string) => string | undefined;
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const response = await siteSettingList();
  const settings: SiteSettingMiniOutDto[] = Array.isArray(response.data) ? response.data : [];
  const getSetting = (key: string) => settings.find((item) => item.key === key)?.value;
  const parseNumber = (key: string) => {
    const value = getSetting(key);
    return value === undefined ? undefined : Number.parseFloat(value);
  };
  const vk = getSetting("vk");
  const mail = getSetting("mail");
  const weekdayStart = getSetting("start_weekday");
  const weekdayEnd = getSetting("end_weekday");
  const weekendStart = getSetting("start_weekend");
  const weekendEnd = getSetting("end_weekend");

  return {
    address: getSetting("address"),
    addressLatitude: parseNumber("address_latitude"),
    addressLongitude: parseNumber("address_longitude"),
    phone: getSetting("tel"),
    siteName: getSetting("site_name"),
    weekdayHours: weekdayStart && weekdayEnd ? `${weekdayStart} - ${weekdayEnd}` : undefined,
    weekendHours: weekendStart && weekendEnd ? `${weekendStart} - ${weekendEnd}` : undefined,
    vk,
    mail,
    socials: [
      vk && { label: "VK", href: vk, type: "vk" as const },
      mail && { label: "Email", href: `mailto:${mail}`, type: "mail" as const },
    ].filter((item): item is { label: string; href: string; type: "vk" | "mail" } => Boolean(item)),
    pricePlus: parseNumber("price_plus"),
    getSetting,
  };
};
