import * as Sentry from "@sentry/nextjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { captureErrorOnce, initializeSentry } from "./sentry";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
}));

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
});

describe("Sentry runtime boundary", () => {
  it("does not initialize the SDK when disabled", () => {
    process.env = { ...originalEnv, SENTRY_ENABLED: "false", SENTRY_DSN: "" };

    expect(initializeSentry()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("initializes the SDK once with enabled configuration", () => {
    process.env = {
      ...originalEnv,
      SENTRY_ENABLED: "true",
      SENTRY_DSN: "https://public@example.invalid/1",
      SENTRY_TRACES_SAMPLE_RATE: "1",
    };

    expect(initializeSentry()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it("captures the same Error object only once", () => {
    process.env = {
      ...originalEnv,
      SENTRY_ENABLED: "true",
      SENTRY_DSN: "https://public@example.invalid/1",
      SENTRY_TRACES_SAMPLE_RATE: "0",
    };
    const error = new Error("controlled test error");

    expect(captureErrorOnce(error)).toBe(true);
    expect(captureErrorOnce(error)).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
