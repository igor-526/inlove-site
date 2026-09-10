import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteSettingList } from "@/api/siteSettings";
import { FALLBACK_SHARED_SETTINGS, SHARED_SETTING_KEYS, getSiteSettings, normalizeSharedSettings } from "./getSiteSettings";

vi.mock("@/api/siteSettings", () => ({ siteSettingList: vi.fn() }));
const setting = (key: string, value: string, type = "string") => ({ key, value, type });

describe("shared settings adapter", () => {
  beforeEach(() => vi.mocked(siteSettingList).mockReset());

  it("CT-SHELL-01 parses strings and ordered allowlisted object menu with one query", async () => {
    vi.mocked(siteSettingList).mockResolvedValue({ status: "ok", data: [
      setting("site.short_name", "ИНЛав Club"), setting("contacts.primary_phone", "+7 981 838-48-31"),
      setting("header.menu", JSON.stringify([{ href: "/about", label: "  О нас  " }, { href: "/unknown", label: "Нет" }, { href: "/", label: "Домой" }]), "object"),
      setting("social.vk_url", "https://vk.com/inlove"),
    ] });
    const result = await getSiteSettings();
    expect(siteSettingList).toHaveBeenCalledOnce();
    expect(siteSettingList).toHaveBeenCalledWith({ key: [...SHARED_SETTING_KEYS] });
    expect(result.menu).toEqual([{ href: "/about", label: "О нас" }, { href: "/", label: "Домой" }]);
    expect(result.headerPhone).toBe("+7 981 838-48-31");
    expect(result.socialLinks).toHaveLength(1);
  });

  it.each(["/about#privacy", "/about/?from=form#privacy", "javascript:alert(1)", "https://", "//example.com/policy", "", "https://example.com/\\policy"])("drops unavailable or unsafe configured policy URL %s", (url) => {
    expect(normalizeSharedSettings([setting("callback.policy_url", url)]).callback.policyUrl).toBe("");
  });

  it.each(["https://example.com/policy", "http://example.com/policy", "/documents/policy.pdf"])("keeps configured policy URL %s", (url) => {
    expect(normalizeSharedSettings([setting("callback.policy_url", url)]).callback.policyUrl).toBe(url);
  });

  it("CT-SHELL-02 degrades invalid keys and request errors to safe fallbacks", async () => {
    const partial = normalizeSharedSettings([setting("header.menu", "not-json", "object"), setting("footer.description", "42", "number")]);
    expect(partial.menu).toEqual(FALLBACK_SHARED_SETTINGS.menu);
    expect(partial.footerDescription).toBeUndefined();
    vi.mocked(siteSettingList).mockResolvedValue({ status: "error", data: { detail: "offline" } });
    await expect(getSiteSettings()).resolves.toEqual(FALLBACK_SHARED_SETTINGS);
  });
});
