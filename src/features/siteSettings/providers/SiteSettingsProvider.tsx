"use client";

import type { ReactNode } from "react";

import { SiteSettingsContext } from "../context/SiteSettingsContext";
import type { SharedSiteSettings } from "../services/getSiteSettings";

interface SiteSettingsProviderProps {
  children: ReactNode;
  settings: SharedSiteSettings;
}

export const SiteSettingsProvider = ({ children, settings }: SiteSettingsProviderProps) => (
  <SiteSettingsContext.Provider value={settings}>
    {children}
  </SiteSettingsContext.Provider>
);
