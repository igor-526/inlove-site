import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteChrome } from "@/features/siteChrome";
import { FALLBACK_SHARED_SETTINGS } from "@/features/siteSettings";
import PrivacyPage, { metadata } from "./page";

describe("/privacy static policy route", () => {
  it("renders the public policy target with one composed main landmark and h1", () => {
    const html = renderToStaticMarkup(
      <SiteChrome settings={FALLBACK_SHARED_SETTINGS}>
        <PrivacyPage />
      </SiteChrome>,
    );

    expect(html.match(/<main(?:\s|>)/g)).toHaveLength(1);
    expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(html).toContain("Политика обработки персональных данных");
    expect(html).toContain("форме обратной связи");
    expect(metadata.alternates).toEqual({ canonical: "/privacy" });
  });
});
