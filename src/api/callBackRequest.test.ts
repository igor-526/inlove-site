import { afterEach, describe, expect, it, vi } from "vitest";

import { callBackRequestCreate } from "./callBackRequest";

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("callback public POST exception", () => {
  it("serializes payload and sends selector without CMS auth (UT-IL-04)", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = "inlove";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, text: async () => "{}" });
    vi.stubGlobal("fetch", fetchMock);

    await callBackRequestCreate(
      { name: "Анна", phone: "+79991234567", comment: "Перезвоните" },
      { headers: { Authorization: "Bearer cms", Cookie: "session=cms" } },
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(url).toBe("https://api.example.test/api/callback_requests");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({ name: "Анна", phone: "+79991234567", comment: "Перезвоните" });
    expect(headers.get("X-Equestrian-Service-Key")).toBe("inlove");
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("Cookie")).toBe(false);
  });

  it("ignores a caller selector and uses only the configured selector", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = "inlove";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, text: async () => "{}" });
    vi.stubGlobal("fetch", fetchMock);

    await callBackRequestCreate(
      { name: "Анна", phone: "+79991234567", comment: "Перезвоните" },
      { headers: { "X-Equestrian-Service-Key": "foreign-tenant" } },
    );

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get("X-Equestrian-Service-Key")).toBe("inlove");
  });

  it("removes a caller selector when the configured selector is missing", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api";
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = "   ";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: "Unauthorized", text: async () => "{\"detail\":\"Missing selector\"}" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(callBackRequestCreate(
      { name: "Анна", phone: "+79991234567", comment: "Перезвоните" },
      { headers: { "X-Equestrian-Service-Key": "foreign-tenant" } },
    )).resolves.toEqual({
      status: "error",
      statusCode: 401,
      data: { detail: "Missing selector" },
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).has("X-Equestrian-Service-Key")).toBe(false);
  });
});
