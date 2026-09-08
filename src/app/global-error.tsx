"use client";

import { useEffect } from "react";

import { captureErrorOnce } from "@/lib/observability/sentry";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    captureErrorOnce(error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <main role="alert">
          <h1>Произошла ошибка</h1>
          <button type="button" onClick={reset}>
            Повторить
          </button>
        </main>
      </body>
    </html>
  );
}
