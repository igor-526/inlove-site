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

  it("never requests the removed legacy contact keys and exposes the new atomic map/hours keys", () => {
    expect(SHARED_SETTING_KEYS).not.toContain("contacts.coordinates");
    expect(SHARED_SETTING_KEYS).not.toContain("contacts.maps_url");
    expect(SHARED_SETTING_KEYS).not.toContain("contacts.working_hours");
    for (const key of [
      "contacts.map.latitude", "contacts.map.longitude", "contacts.map.url", "contacts.nearest_stop",
      "contacts.hours.weekdays.start", "contacts.hours.weekdays.stop",
      "contacts.hours.weekend.start", "contacts.hours.weekend.stop",
    ]) expect(SHARED_SETTING_KEYS).toContain(key);
  });

  it("ignores removed legacy keys even if the API still returns them", () => {
    const result = normalizeSharedSettings([
      setting("contacts.coordinates", '{"latitude":59,"longitude":30}', "object"),
      setting("contacts.maps_url", "https://legacy.example"),
      setting("contacts.working_hours", "10:00-21:00"),
    ]);
    expect(result).not.toHaveProperty("coordinates");
    expect(result).not.toHaveProperty("mapsUrl");
    expect(result).not.toHaveProperty("workingHours");
    expect(result.mapLatitude).toBeUndefined();
    expect(result.mapLongitude).toBeUndefined();
    expect(result.mapUrl).toBeUndefined();
  });

  it("reads atomic map coordinates and url, degrading missing or wrongly typed values", async () => {
    const result = normalizeSharedSettings([
      setting("contacts.address", " Адрес "), setting("contacts.nearest_stop", "Иннолово — Весовая площадка, ≈1 км"),
      setting("contacts.map.latitude", "59.773315", "float"), setting("contacts.map.longitude", "29.973801", "float"),
      setting("contacts.map.url", "https://yandex.ru/maps/?ll=1,1"), setting("footer.description", "42", "number"),
    ]);
    expect(result).toMatchObject({
      address: "Адрес", nearestStop: "Иннолово — Весовая площадка, ≈1 км",
      mapLatitude: 59.773315, mapLongitude: 29.973801, mapUrl: "https://yandex.ru/maps/?ll=1,1",
    });
    expect(result.footerDescription).toBeUndefined();

    const wrongType = normalizeSharedSettings([
      setting("contacts.map.latitude", "59.773315", "string"), setting("contacts.map.longitude", "29.973801", "number"),
    ]);
    expect(wrongType.mapLatitude).toBeUndefined();
    expect(wrongType.mapLongitude).toBeUndefined();

    vi.mocked(siteSettingList).mockResolvedValue({ status: "error", data: { detail: "offline" } });
    await expect(getSiteSettings()).resolves.toEqual(normalizeSharedSettings([]));
    expect(normalizeSharedSettings([])).toMatchObject(FALLBACK_SHARED_SETTINGS);
  });

  it("treats an empty or whitespace-only float value as absent instead of 0", () => {
    const empty = normalizeSharedSettings([
      setting("contacts.map.latitude", "", "float"), setting("contacts.map.longitude", "", "float"),
    ]);
    expect(empty.mapLatitude).toBeUndefined();
    expect(empty.mapLongitude).toBeUndefined();

    const whitespace = normalizeSharedSettings([
      setting("contacts.map.latitude", "   ", "float"), setting("contacts.map.longitude", "\t\n", "float"),
    ]);
    expect(whitespace.mapLatitude).toBeUndefined();
    expect(whitespace.mapLongitude).toBeUndefined();
  });

  it("collects weekday/weekend hours only when both start and stop are present", () => {
    const both = normalizeSharedSettings([
      setting("contacts.hours.weekdays.start", "10:00", "time"), setting("contacts.hours.weekdays.stop", "21:00", "time"),
      setting("contacts.hours.weekend.start", "10:00", "time"), setting("contacts.hours.weekend.stop", "21:00", "time"),
    ]);
    expect(both.weekdayHours).toEqual({ start: "10:00", stop: "21:00" });
    expect(both.weekendHours).toEqual({ start: "10:00", stop: "21:00" });

    const partialWeekendOnly = normalizeSharedSettings([
      setting("contacts.hours.weekend.start", "10:00", "time"),
    ]);
    expect(partialWeekendOnly.weekdayHours).toBeUndefined();
    expect(partialWeekendOnly.weekendHours).toBeUndefined();

    const wrongType = normalizeSharedSettings([
      setting("contacts.hours.weekdays.start", "10:00", "string"), setting("contacts.hours.weekdays.stop", "21:00", "time"),
    ]);
    expect(wrongType.weekdayHours).toBeUndefined();
  });
});
