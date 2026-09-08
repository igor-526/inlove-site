import { describe, expect, it } from "vitest";

import { getSentryConfig, sanitizeSentryEvent } from "./sentry-config";

describe("getSentryConfig", () => {
  it("is disabled by default without requiring a DSN", () => {
    expect(getSentryConfig({})).toBeNull();
  });

  it("returns enabled metadata and accepts the lower sample-rate boundary", () => {
    expect(getSentryConfig({
      SENTRY_ENABLED: "true",
      SENTRY_DSN: "https://public@example.invalid/1",
      SENTRY_ENVIRONMENT: "qa",
      SENTRY_TRACES_SAMPLE_RATE: "0",
      SENTRY_RELEASE: "site-ksk-inlove@1",
    })).toMatchObject({
      dsn: "https://public@example.invalid/1",
      environment: "qa",
      release: "site-ksk-inlove@1",
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
  });

  it("rejects enabled monitoring without a DSN", () => {
    expect(() => getSentryConfig({ SENTRY_ENABLED: "true", SENTRY_DSN: "" }))
      .toThrow("SENTRY_DSN is required");
  });

  it.each(["-0.1", "1.1", "invalid"])("rejects invalid sample rate %s", (rate) => {
    expect(() => getSentryConfig({
      SENTRY_ENABLED: "true",
      SENTRY_DSN: "https://public@example.invalid/1",
      SENTRY_TRACES_SAMPLE_RATE: rate,
    })).toThrow("SENTRY_TRACES_SAMPLE_RATE");
  });
});

describe("sanitizeSentryEvent", () => {
  it("removes credentials, tenant hints and request bodies recursively", () => {
    const sanitized = sanitizeSentryEvent({
      type: undefined,
      request: {
        headers: { authorization: "Bearer secret", accept: "text/html" },
        cookies: { session: "secret" },
        data: { body: "private", safe: "kept" },
      },
      extra: { tenantSelector: "private", safe: "kept" },
    });

    expect(sanitized).toEqual({
      request: { headers: { accept: "text/html" } },
      extra: { safe: "kept" },
    });
  });
});
