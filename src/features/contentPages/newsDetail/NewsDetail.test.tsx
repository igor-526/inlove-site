import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page, { dynamic, generateMetadata } from "@/app/novosti/[slug]/page";
import { loadContentSettings, loadNewsDetail } from "../services/loaders";
import type { NewsPublicDetailOutDto } from "@/types/news";

vi.mock("../services/loaders", async (original) => ({
  ...await original<typeof import("../services/loaders")>(),
  loadNewsDetail: vi.fn(), loadContentSettings: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("route-404"); } }));
const props = () => ({ params: Promise.resolve({ slug: "stable-slug" }) });
const news: NewsPublicDetailOutDto = {
  id: "1", slug: "stable-slug", name: "Жизнь клуба", snippet: "Новости <strong>клуба</strong>",
  published_at: "2026-09-01T23:30:00Z", photos: [{ id: "00000000-0000-4000-8000-000000000001", is_main: true, url: "/photo.jpg" }],
  content: '<h1>Лишний заголовок</h1><h2>Событие</h2><p>Полный текст <strong>новости</strong>.</p><script>alert(1)</script><p onclick="evil()">Безопасно</p><a href="javascript:evil()">Ссылка</a><a href="/about">О клубе</a><img src="x" onerror="evil()"><iframe src="evil"></iframe>',
};
beforeEach(() => {
  vi.mocked(loadNewsDetail).mockResolvedValue({ status: "success", data: news });
  vi.mocked(loadContentSettings).mockResolvedValue({ status: "empty" });
});

describe("UT-SC-09 direct server entry", () => {
  it("renders full safe HTML, one h1, date, photo and archive link", async () => {
    expect(dynamic).toBe("force-dynamic");
    const html = renderToStaticMarkup(await Page(props()));
    expect(loadNewsDetail).toHaveBeenCalledWith("stable-slug");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Жизнь клуба");
    expect(html).toContain("Полный текст <strong>новости</strong>");
    expect(html).toContain('href="/novosti"');
    expect(html).toContain('src="/photo.jpg"');
    expect(html).toContain("2 сентября 2026");
    expect(html).toContain('href="/about"');
    expect(html).not.toMatch(/<script|<iframe|onclick|onerror|javascript:|alert\(1\)/);
  });
  it("uses selected news for plain metadata and exact canonical", async () => {
    expect(await generateMetadata(props())).toMatchObject({ title: news.name, description: "Новости клуба", alternates: { canonical: "/novosti/stable-slug" } });
    vi.mocked(loadNewsDetail).mockResolvedValue({ status: "success", data: { ...news, snippet: null, content: "<p>Полный <em>текст</em></p>" } });
    expect((await generateMetadata(props())).description).toBe("Полный текст");
  });
  it("uses site timezone and survives invalid timezone and no photos", async () => {
    vi.mocked(loadContentSettings).mockResolvedValue({ status: "success", data: [{ key: "site.timezone", type: "string", value: "UTC" }] });
    expect(renderToStaticMarkup(await Page(props()))).toContain("1 сентября 2026");
    vi.mocked(loadContentSettings).mockResolvedValue({ status: "success", data: [{ key: "site.timezone", type: "string", value: "invalid" }] });
    vi.mocked(loadNewsDetail).mockResolvedValue({ status: "success", data: { ...news, photos: [] } });
    expect(renderToStaticMarkup(await Page(props()))).toContain("2 сентября 2026");
  });
});

describe("UT-SC-10 data failures", () => {
  it("raises route 404 in page and metadata for upstream not-found", async () => {
    vi.mocked(loadNewsDetail).mockResolvedValue({ status: "not-found" });
    await expect(Page(props())).rejects.toThrow("route-404");
    await expect(generateMetadata(props())).rejects.toThrow("route-404");
  });
  it.each([401, 500, 503, undefined])("keeps %s failure separate from 404 and marks noindex", async (statusCode) => {
    vi.mocked(loadNewsDetail).mockResolvedValue({ status: "error", statusCode });
    const html = renderToStaticMarkup(await Page(props()));
    expect(html).toContain("Не удалось загрузить новость");
    expect(html).toContain('href="/novosti/stable-slug"');
    expect(html).toContain('href="/novosti"');
    expect(html).not.toContain(news.name);
    expect(await generateMetadata(props())).toMatchObject({ robots: { index: false, follow: true } });
  });
});
