import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteSettingsProvider } from "./providers/SiteSettingsProvider";
import { FALLBACK_SHARED_SETTINGS, type SharedSiteSettings } from "./services/getSiteSettings";
import { useSiteSettings } from "./context/SiteSettingsContext";

const settings: SharedSiteSettings = { ...FALLBACK_SHARED_SETTINGS, shortName: "InLove" };

const SettingsConsumer = () => {
  const value = useSiteSettings();
  return <span>{value.shortName}</span>;
};

describe("site settings provider and hook", () => {
  it("provides site settings to descendants (UT-IL-06)", () => {
    const html = renderToStaticMarkup(
      <SiteSettingsProvider settings={settings}>
        <SettingsConsumer />
      </SiteSettingsProvider>,
    );

    expect(html).toBe("<span>InLove</span>");
  });

  it("throws a controlled error outside the provider (UT-IL-06)", () => {
    expect(() => renderToStaticMarkup(<SettingsConsumer />)).toThrow(
      "useSiteSettings must be used within SiteSettingsProvider",
    );
  });
});
