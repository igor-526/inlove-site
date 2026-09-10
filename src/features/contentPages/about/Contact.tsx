"use client";

import type { ComponentProps } from "react";
import { ContactSection } from "@/ui/sections";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";

export function AboutContact(props: Omit<ComponentProps<typeof ContactSection>, "context" | "onRequest">) {
  return <ContactSection {...props} context="О клубе" onRequest={(context) => window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: "/about", serviceName: context } }))} />;
}
