import { ApiResult, DetailResponse } from "@/types";

class ApiConfigurationError extends Error {}

export function addQueryParamsToUrl<T extends Record<string, unknown>>(
  url: string,
  params: T = {} as T
) {
  const hashIndex = url.indexOf("#");
  const hasHash = hashIndex >= 0;

  const withoutHash = hasHash ? url.slice(0, hashIndex) : url;
  const hash = hasHash ? url.slice(hashIndex) : "";

  const [path, initialQuery = ""] = withoutHash.split("?");
  const searchParams = new URLSearchParams(initialQuery);

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      searchParams.delete(key);
      for (const item of value) {
        if (item != null) {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  const queryPart = queryString ? `?${queryString}` : "";

  return `${path}${queryPart}${hash}`;
}

function ensureApiSuffix(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "/api";
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function resolveApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredUrl) {
    throw new ApiConfigurationError("NEXT_PUBLIC_API_BASE_URL must be configured");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new ApiConfigurationError("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ApiConfigurationError("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL");
  }

  return ensureApiSuffix(parsedUrl.toString());
}

export function resolveEquestrianServiceKey() {
  return (process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY ?? "default").trim();
}

export function buildHeaders(options?: RequestInit) {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  for (const [key, value] of Object.entries(normalizeHeaders(options?.headers))) {
    headers.set(key, value);
  }

  const serviceKey = resolveEquestrianServiceKey();

  if (serviceKey) {
    headers.set("X-Equestrian-Service-Key", serviceKey);
  }

  return headers;
}

export default async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  const method = options?.method?.toUpperCase() ?? "GET";
  const isCallbackException = method === "POST" && path === "/callback_requests";

  if (method !== "GET" && !isCallbackException) {
    return { status: "error", data: { detail: "Unsupported public API operation" } };
  }

  try {
    const apiBaseUrl = resolveApiBaseUrl();
    const url = `${apiBaseUrl}${path}`;
    const finalOptions: RequestInit = {
      ...options,
      headers: buildHeaders(options),
      credentials: "omit",
    };

    // On server side, prefer fresh data for GET requests to reflect CMS changes
    if (typeof window === "undefined") {
      const requestMethod = finalOptions.method ? String(finalOptions.method).toUpperCase() : "GET";
      if (requestMethod === "GET") {
        // don't override explicit cache option from caller
        if ((finalOptions).cache == null) {
          (finalOptions).cache = "no-store";
        }
      }
    }

    const res = await fetch(url, finalOptions);

    if (res.status === 204 || res.status === 205) {
      return { status: "ok", data: null as unknown as T };
    }

    const raw = await res.text();
    const parsed = raw ? safeJson(raw) : null;

    if (raw && parsed === null) {
      return { status: "error", data: { detail: "Network error or invalid JSON" } };
    }

    if (res.ok) {
      return { status: "ok", data: (parsed as T) ?? (null as unknown as T) };
    }

    const detail =
      (parsed as DetailResponse | null)?.detail ||
      (raw?.trim() || res.statusText || "Request failed");

    return { status: "error", data: { detail }, statusCode: res.status };
  } catch (error) {
    if (error instanceof ApiConfigurationError) {
      return { status: "error", data: { detail: "Public API is not configured" } };
    }
    return { status: "error", data: { detail: "Network error or invalid JSON" } };
  }
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
