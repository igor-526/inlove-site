import { afterEach, describe, expect, it, vi } from "vitest";

import apiFetch, {
  addQueryParamsToUrl,
  buildHeaders,
  resolveApiBaseUrl,
  resolveEquestrianServiceKey,
} from "./client";

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("public read client", () => {
  it("builds stable API URLs and query parameters (UT-IL-01)", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
    expect(resolveApiBaseUrl()).toBe("https://api.example.test/api");
    expect(addQueryParamsToUrl("/horses?active=true#list", { page: 2, tag: ["a", "b"] }))
      .toBe("/horses?active=true&page=2&tag=a&tag=b#list");
  });

  it.each([undefined, "", "   ", "/api", "api.example.test", "ftp://api.example.test"])(
    "fails safely when NEXT_PUBLIC_API_BASE_URL is missing or invalid: %s",
    async (configuredUrl) => {
      if (configuredUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_BASE_URL = configuredUrl;
      }
      process.env.API_BASE_URL = "https://unapproved-fallback.example.test/api";
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      expect(() => resolveApiBaseUrl()).toThrow(/NEXT_PUBLIC_API_BASE_URL/);
      await expect(apiFetch("/horses")).resolves.toEqual({
        status: "error",
        data: { detail: "Public API is not configured" },
      });
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("adds selector to anonymous GET and removes CMS credentials (UT-IL-02)", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = " inlove ";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "{\"items\":[]}" });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/horses", { headers: { Authorization: "Bearer cms", Cookie: "session=cms" } });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("X-Equestrian-Service-Key")).toBe("inlove");
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("Cookie")).toBe(false);
    expect(options.credentials).toBe("omit");
  });

  it("ignores a caller selector and uses only the configured selector for GET", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = "inlove";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "{}" });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/horses", {
      headers: { "X-Equestrian-Service-Key": "foreign-tenant" },
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get("X-Equestrian-Service-Key")).toBe("inlove");
  });

  it("removes a caller selector when the configured selector is missing (UT-IL-03)", async () => {
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = "   ";
    process.env.EQUESTRIAN_SERVICE_KEY = "foreign-tenant";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: "Unauthorized", text: async () => "{\"detail\":\"Missing selector\"}" });
    vi.stubGlobal("fetch", fetchMock);

    expect(resolveEquestrianServiceKey()).toBe("");
    expect(buildHeaders({ headers: { "X-Equestrian-Service-Key": "foreign-tenant" } }).has("X-Equestrian-Service-Key")).toBe(false);
    await expect(apiFetch("/horses", {
      headers: { "X-Equestrian-Service-Key": "foreign-tenant" },
    })).resolves.toEqual({
      status: "error",
      statusCode: 401,
      data: { detail: "Missing selector" },
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).has("X-Equestrian-Service-Key")).toBe(false);
  });

  it("blocks every write except the callback exception", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiFetch("/horses", { method: "POST" })).resolves.toEqual({
      status: "error",
      data: { detail: "Unsupported public API operation" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["non-2xx", { ok: false, status: 401, statusText: "Unauthorized", text: async () => "{\"detail\":\"Invalid selector\"}" }, { status: "error", statusCode: 401, data: { detail: "Invalid selector" } }],
    ["invalid JSON", { ok: true, status: 200, statusText: "OK", text: async () => "not-json" }, { status: "error", data: { detail: "Network error or invalid JSON" } }],
  ])("normalizes %s responses (UT-IL-05)", async (_label, response, expected) => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(apiFetch("/horses")).resolves.toEqual(expected);
  });

  it("normalizes network errors without exposing details (UT-IL-05)", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret upstream URL")));
    await expect(apiFetch("/horses")).resolves.toEqual({
      status: "error",
      data: { detail: "Network error or invalid JSON" },
    });
  });
});
