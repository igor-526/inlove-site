import { ApiResult, DetailResponse } from "@/types";

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
  const explicitUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL;

  if (explicitUrl) {
    const trimmed = explicitUrl.trim();

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return ensureApiSuffix(trimmed);
    }

    if (trimmed.startsWith("//")) {
      if (typeof window !== "undefined") {
        const protocol = window.location.protocol;
        return ensureApiSuffix(`${protocol}${trimmed.replace(/\/+$/, "")}`);
      }
      return ensureApiSuffix(`https:${trimmed.replace(/\/+$/, "")}`);
    }

    if (trimmed.startsWith("/")) {
      if (typeof window !== "undefined") {
        return ensureApiSuffix(`${window.location.origin}${trimmed.replace(/\/+$/, "")}`);
      }
      return ensureApiSuffix(`http://localhost:8001${trimmed.replace(/\/+$/, "")}`);
    }

    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      return ensureApiSuffix(`${protocol}//${trimmed.replace(/\/+$/, "")}`);
    }

    return ensureApiSuffix(`https://${trimmed.replace(/\/+$/, "")}`);
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;

    const configuredPort = process.env.NEXT_PUBLIC_API_PORT;
    const backendPort =
      configuredPort && configuredPort.trim() !== ""
        ? configuredPort
        : port && port !== "" && port !== "3000"
          ? port
          : "8001";

    const normalizedPort =
      (protocol === "http:" && backendPort === "80") ||
        (protocol === "https:" && backendPort === "443")
        ? ""
        : `:${backendPort}`;

    return ensureApiSuffix(`${protocol}//${hostname}${normalizedPort}`);
  }

  return ensureApiSuffix("http://localhost:8001");
}

export function resolveEquestrianServiceKey() {
  return (process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY ?? "").trim();
}

export function buildHeaders(options?: RequestInit) {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  for (const [key, value] of Object.entries(normalizeHeaders(options?.headers))) {
    headers.set(key, value);
  }

  // Public consumers never forward CMS credentials, even when a caller supplies them.
  headers.delete("Authorization");
  headers.delete("Cookie");
  headers.delete("X-Equestrian-Service-Key");

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

  const apiBaseUrl = resolveApiBaseUrl();
  const url = `${apiBaseUrl}${path}`;

  try {
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
  } catch {
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
