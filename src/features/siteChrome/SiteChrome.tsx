"use client";

import type { ReactNode } from "react";
import { SiteSettingsProvider, type SharedSiteSettings } from "@/features/siteSettings";
import { CallbackController } from "@/features/callBackRequest";
import { SiteFooter, SiteHeader } from "@/ui/navigation";

export const CALLBACK_REQUEST_EVENT = "inlove:callback-request";

export function SiteChrome({ settings, children }: { settings: SharedSiteSettings; children: ReactNode }) {
  const requestCallback = (source: "header" | "mobile-menu" | "sticky") => {
    window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { source, route: window.location.pathname } }));
  };
  return <SiteSettingsProvider settings={settings}><SiteHeader shortName={settings.shortName} menu={settings.menu} phone={settings.headerPhone} socialLinks={settings.socialLinks} ctaLabel={settings.headerCtaLabel} onRequestCallback={requestCallback} /><main>{children}</main><SiteFooter shortName={settings.shortName} description={settings.footerDescription} menu={settings.menu} address={settings.address} phone={settings.phone} workingHours={settings.workingHours} mapsUrl={settings.mapsUrl} socialLinks={settings.socialLinks} copyrightName={settings.copyrightName} /><CallbackController /></SiteSettingsProvider>;
}
