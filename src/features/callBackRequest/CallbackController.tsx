"use client";

import { useEffect, useState } from "react";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import { CallbackModal } from "./CallbackModal";
import type { CallbackContext } from "./schema";

const CLOSED_CONTEXT: CallbackContext = { route: "/" };

export function CallbackController() {
  const [context, setContext] = useState<CallbackContext | null>(null);
  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<Partial<CallbackContext>>).detail ?? {};
      setContext({ ...detail, route: typeof detail.route === "string" && detail.route ? detail.route : window.location.pathname });
    };
    window.addEventListener(CALLBACK_REQUEST_EVENT, open);
    return () => window.removeEventListener(CALLBACK_REQUEST_EVENT, open);
  }, []);
  return <CallbackModal open={context !== null} context={context ?? CLOSED_CONTEXT} onClose={() => setContext(null)} />;
}
