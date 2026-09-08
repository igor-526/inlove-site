import * as Sentry from "@sentry/nextjs";

import { getSentryConfig } from "./sentry-config";

const capturedErrors = new WeakSet<object>();

export function initializeSentry(): boolean {
  const config = getSentryConfig();
  if (!config) return false;

  Sentry.init(config);
  return true;
}

export function captureErrorOnce(error: Error & { digest?: string }): boolean {
  if (!getSentryConfig() || capturedErrors.has(error)) return false;

  capturedErrors.add(error);
  Sentry.captureException(error);
  return true;
}

export function captureRequestError(...args: Parameters<typeof Sentry.captureRequestError>): void {
  if (getSentryConfig()) Sentry.captureRequestError(...args);
}
