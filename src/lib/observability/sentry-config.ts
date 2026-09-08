import type { ErrorEvent } from "@sentry/nextjs";
import type * as Sentry from "@sentry/nextjs";

type SentryEnvironment = Partial<Record<
  | "SENTRY_ENABLED"
  | "SENTRY_DSN"
  | "SENTRY_ENVIRONMENT"
  | "SENTRY_TRACES_SAMPLE_RATE"
  | "SENTRY_RELEASE",
  string
>>;

type SentryOptions = Parameters<typeof Sentry.init>[0];

const SENSITIVE_KEY = /authorization|cookie|service[-_]?key|tenant|password|secret|token|dsn|body|data/i;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, nestedValue]) =>
        SENSITIVE_KEY.test(key) ? [] : [[key, sanitize(nestedValue)]],
      ),
    );
  }

  return value;
}

export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent {
  return sanitize(event) as ErrorEvent;
}

export function getSentryConfig(
  env: SentryEnvironment = process.env as SentryEnvironment,
): SentryOptions | null {
  if ((env.SENTRY_ENABLED ?? "false").trim().toLowerCase() !== "true") {
    return null;
  }

  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) {
    throw new Error("SENTRY_DSN is required when SENTRY_ENABLED=true");
  }

  const tracesSampleRate = Number(env.SENTRY_TRACES_SAMPLE_RATE ?? "0");
  if (!Number.isFinite(tracesSampleRate) || tracesSampleRate < 0 || tracesSampleRate > 1) {
    throw new Error("SENTRY_TRACES_SAMPLE_RATE must be a number between 0 and 1");
  }

  return {
    dsn,
    environment: env.SENTRY_ENVIRONMENT?.trim() || undefined,
    release: env.SENTRY_RELEASE?.trim() || undefined,
    tracesSampleRate,
    sendDefaultPii: false,
    beforeSend: sanitizeSentryEvent,
  };
}
