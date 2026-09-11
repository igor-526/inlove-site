import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteSettingList } from "@/api/siteSettings";
import { SITE_CONSUMER_CONFIG } from "../config";
import { FALLBACK_SHARED_SETTINGS, SHARED_SETTING_KEYS, getSiteSettings, normalizeSharedSettings } from "./getSiteSettings";

vi.mock("@/api/siteSettings", () => ({ siteSettingList: vi.fn() }));
const setting = (key: string, value: string, type = "string") => ({ key, value, type });

describe("shared settings adapter", () => {
  beforeEach(() => vi.mocked(siteSettingList).mockReset());

  it("requests only the curated shared allowlist and uses the primary phone everywhere", async () => {
    vi.mocked(siteSettingList).mockResolvedValue({ status: "ok", data: [
      setting("contacts.primary_phone", "+7 981 838-48-31"), setting("header.contact_phone", "+7 legacy"),
      setting("contacts.phones", "legacy"), setting("contacts.address_alternative", "legacy"),
      setting("social.vk_url", "https://vk.com/inlove"),
    ] });
    const result = await getSiteSettings();
    expect(siteSettingList).toHaveBeenCalledWith({ key: [...SHARED_SETTING_KEYS] });
    expect(result.phone).toBe("+7 981 838-48-31");
    expect(result).not.toHaveProperty("headerPhone");
    expect(result.menu).toEqual(SITE_CONSUMER_CONFIG.menu);
    expect(JSON.stringify(SHARED_SETTING_KEYS)).not.toMatch(/header|callback|seo|address_alternative|contacts\.phones/);
  });

  it("keeps static presentation config when legacy settings are returned", () => {
    const result = normalizeSharedSettings([
      setting("site.short_name", "Legacy"), setting("header.cta_label", "Legacy CTA"),
      setting("callback.title", "Legacy modal"), setting("seo.default_title", "Legacy SEO"),
    ]);
    expect(result.shortName).toBe(SITE_CONSUMER_CONFIG.shortName);
    expect(result.headerCtaLabel).toBe(SITE_CONSUMER_CONFIG.headerCtaLabel);
    expect(result.callback).toEqual(SITE_CONSUMER_CONFIG.callback);
    expect(result.seo.defaultTitle).toBe(SITE_CONSUMER_CONFIG.seo.defaultTitle);
  });

  it("parses atomic contacts independently and degrades invalid values", async () => {
    const result = normalizeSharedSettings([
      setting("contacts.address", " Адрес "), setting("contacts.nearest_stop", "Остановка"),
      setting("contacts.coordinates", '{"lat":59,"lng":30}', "object"), setting("footer.description", "42", "number"),
    ]);
    expect(result).toMatchObject({ address: "Адрес", nearestStop: "Остановка", coordinates: { lat: 59, lng: 30 } });
    expect(result.footerDescription).toBeUndefined();
    vi.mocked(siteSettingList).mockResolvedValue({ status: "error", data: { detail: "offline" } });
    await expect(getSiteSettings()).resolves.toEqual(normalizeSharedSettings([]));
    expect(normalizeSharedSettings([])).toMatchObject(FALLBACK_SHARED_SETTINGS);
  });
});
