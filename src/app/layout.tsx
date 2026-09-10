import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SiteChrome } from "@/features/siteChrome";
import { getSiteSettings } from "@/features/siteSettings";

import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["cyrillic", "latin"], variable: "--font-cormorant", display: "swap" });
const sans = Manrope({ subsets: ["cyrillic", "latin"], variable: "--font-manrope", display: "swap" });

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const settings = await getSiteSettings();
  return (
    <html lang="ru">
      <body className={`${serif.variable} ${sans.variable}`}><SiteChrome settings={settings}>{children}</SiteChrome></body>
    </html>
  );
}
