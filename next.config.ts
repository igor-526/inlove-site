import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SENTRY_ENABLED: process.env.SENTRY_ENABLED ?? "false",
    SENTRY_DSN: process.env.SENTRY_DSN ?? "",
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT ?? "",
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0",
    SENTRY_RELEASE: process.env.SENTRY_RELEASE ?? "",
  },
  eslint: { ignoreDuringBuilds: true },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
});
