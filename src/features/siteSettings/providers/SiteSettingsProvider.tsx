"use client";

import type { ReactNode } from "react";

import { SiteSettingsContext } from "../context/SiteSettingsContext";
import type { SiteSettings } from "../services/getSiteSettings";

interface SiteSettingsProviderProps {
  children: ReactNode;
  settings: SiteSettings;
}

export const SiteSettingsProvider = ({ children, settings }: SiteSettingsProviderProps) => (
  <SiteSettingsContext.Provider value={settings}>
    {children}
  </SiteSettingsContext.Provider>
);
