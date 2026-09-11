import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NewsArchive, NewsPagination, newsDate } from "./NewsArchive";
import NewsPage, { generateMetadata } from "@/app/novosti/page";
import { loadNewsArchive } from "../services/loaders";

vi.mock("../services/loaders", async (original) => ({
  ...await original<typeof import("../services/loaders")>(),
  loadNewsArchive: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("not-found"); },
}));
const items = (start: number, count: number) => Array.from({ length: count }, (_, index) => ({
  id: String(start + index), slug: `news-${start + index}`, name: `Новость ${start + index}`,
  snippet: "Краткий текст", published_at: "2026-09-01T23:30:00Z", photos: [],
}));
const props = (page?: string | string[]) => ({ searchParams: Promise.resolve({ page }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadNewsArchive).mockResolvedValue({ status: "success", data: { total: 26, items: items(1, 12) } });
});

describe("UT-SC-07 server pagination", () => {
  it.each([[undefined, 1, "/novosti"], ["2", 2, "/novosti?page=2"]] as const)("renders page %s once with canonical", async (raw, page, canonical) => {
    vi.mocked(loadNewsArchive).mockResolvedValue({ status: "success", data: { total: 26, items: items((page - 1) * 12 + 1, 12) } });
    const html = renderToStaticMarkup(await NewsPage(props(raw)));
    expect(loadNewsArchive).toHaveBeenCalledWith(page);
    expect(html.match(/<article /g)).toHaveLength(12);
    expect(html.match(/href="\/novosti\/news-/g)).toHaveLength(12);
    expect(html.match(/<h1 /g)).toHaveLength(1);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('rel="next"');
    expect((await generateMetadata(props(raw))).alternates?.canonical).toBe(canonical);
  });

  it("last page contains only remaining items and no next link", async () => {
    vi.mocked(loadNewsArchive).mockResolvedValue({ status: "success", data: { total: 26, items: items(25, 2) } });
    const html = renderToStaticMarkup(await NewsPage(props("3")));
    expect(html.match(/<article /g)).toHaveLength(2);
    expect(html).not.toContain('rel="next"');
    expect(html).toContain('href="/novosti?page=2"');
  });

  it.each(["0", "-1", "abc", "1", "1.5", ["2", "3"]].map((page) => ({ page })))("redirects invalid or explicit first page %s", async ({ page }) => {
    await expect(NewsPage(props(page))).rejects.toThrow("redirect:/novosti");
    expect(loadNewsArchive).not.toHaveBeenCalled();
  });

  it("returns true route 404 for overflow", async () => {
    vi.mocked(loadNewsArchive).mockResolvedValue({ status: "not-found" });
    await expect(NewsPage(props("4"))).rejects.toThrow("not-found");
    await expect(generateMetadata(props("4"))).rejects.toThrow("not-found");
  });

  it("keeps navigation bounded even for large archives", () => {
    const html = renderToStaticMarkup(<NewsPagination page={1000} total={24000} nextLabel="Далее" />);
    expect(html.length).toBeLessThan(2000);
    expect(html).toContain('href="/novosti"');
  });
});

describe("UT-SC-08 states and SSR", () => {
  it("renders static empty state without pagination", async () => {
    vi.mocked(loadNewsArchive).mockResolvedValue({ status: "empty" });
    const html = renderToStaticMarkup(await NewsPage(props()));
    expect(html).toContain("Новостей пока нет");
    expect(html).not.toContain("<nav");
    expect((await generateMetadata(props())).robots).toBeUndefined();
  });

  it.each([401, 500, undefined])("distinguishes API %s from empty and sets noindex with retry", async (statusCode) => {
    vi.mocked(loadNewsArchive).mockResolvedValue({ status: "error", statusCode });
    const html = renderToStaticMarkup(await NewsPage(props("2")));
    expect(html).toContain("Не удалось загрузить");
    expect(html).not.toContain("Новостей пока нет");
    expect(html).toContain('href="/novosti?page=2"');
    expect((await generateMetadata(props("2"))).robots).toEqual({ index: false, follow: true });
  });

  it("renders content without client fetch and escapes HTML", () => {
    const records = items(1, 1);
    records[0].name = '<script>alert("x")</script>';
    const html = renderToStaticMarkup(<NewsArchive state={{ status: "success", data: { total: 1, items: records } }}
      page={1} emptyText="Пусто" nextLabel="Далее" timezone="Europe/Moscow" />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("2 сентября");
    expect(html).toContain('href="/novosti/news-1"');
    expect(html).toContain("Задать вопрос");
  });

  it("uses configured timezone and safe fallback", () => {
    expect(newsDate("2026-09-01T23:30:00Z", "UTC")).toContain("1 сентября");
    expect(newsDate("2026-09-01T23:30:00Z", "invalid")).toContain("2 сентября");
  });
});
