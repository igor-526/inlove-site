"use client";

import { createContext, useContext } from "react";

import type { SharedSiteSettings } from "../services/getSiteSettings";

export const SiteSettingsContext = createContext<SharedSiteSettings | null>(null);

export const useSiteSettings = (): SharedSiteSettings => {
  const settings = useContext(SiteSettingsContext);

  if (!settings) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }

  return settings;
};
