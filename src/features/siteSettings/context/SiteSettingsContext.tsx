"use client";

import { createContext, useContext } from "react";

import type { SiteSettings } from "../services/getSiteSettings";

export const SiteSettingsContext = createContext<SiteSettings | null>(null);

export const useSiteSettings = (): SiteSettings => {
  const settings = useContext(SiteSettingsContext);

  if (!settings) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }

  return settings;
};
