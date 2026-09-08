import { describe, expect, it, vi } from "vitest";

const { initializeSentry, captureRequestError } = vi.hoisted(() => ({
  initializeSentry: vi.fn(),
  captureRequestError: vi.fn(),
}));

vi.mock("./sentry", () => ({ initializeSentry, captureRequestError }));

await import("../../../instrumentation-client");
await import("../../../sentry.server.config");
await import("../../../sentry.edge.config");
const instrumentation = await import("../../../instrumentation");

describe("Sentry Next.js entrypoints", () => {
  it("initializes client, server and edge through the shared mocked boundary", () => {
    expect(initializeSentry).toHaveBeenCalledTimes(3);
  });

  it("exposes request-error capture through the shared mocked boundary", () => {
    expect(instrumentation.onRequestError).toBe(captureRequestError);
  });
});
