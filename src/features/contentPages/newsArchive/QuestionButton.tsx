"use client";

import { Button } from "@/ui/controls";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";

export function QuestionButton() {
  return <Button variant="secondary" onClick={() => window.dispatchEvent(
    new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: "/novosti" } }),
  )}>Задать вопрос</Button>;
}
