import { afterEach, beforeEach, expect, it, vi } from "vitest";
// Exercise the real React server cache with a request dispatcher, not a fake memoizer (same
// approach as services/loaders.test.ts, required because loadHorsesList/loadHorseDetail are
// cache()-wrapped).
vi.mock("react", async () => {
  const { createRequire } = await import("node:module");
  const { dirname, join } = await import("node:path");
  const require = createRequire(import.meta.url);
  return require(join(dirname(require.resolve("react/package.json")), "cjs/react.react-server.development.js"));
});
import { loadHorseDetail, loadHorsesList } from "./loaders";

const fetcher = vi.fn();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const horseItem = (slug: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "123e4567-e89b-42d3-a456-426614174000", slug, name: "Марта", pedigree_name: null,
  description: "Спокойная и внимательная лошадь.", breed: null, coat_color: null,
  height: 152, sex: "female", bdate_formatted: "2015", age: 11,
  photos: [], services: [], this_stable: true, ...overrides,
});

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example");
  vi.stubEnv("NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY", "inlove");
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("requests this_stable=true sorted by name and reports empty for an empty catalog", async () => {
  fetcher.mockResolvedValueOnce(response({ total: 0, items: [] }));
  expect(await loadHorsesList()).toEqual({ status: "empty" });
  const [url] = fetcher.mock.calls[0];
  expect(url).toContain("this_stable=true");
  expect(url).toContain("sort=name");
  expect(url).toContain("limit=100");
});

it("returns the validated public horses on success", async () => {
  fetcher.mockResolvedValueOnce(response({ total: 1, items: [horseItem("marta")] }));
  expect(await loadHorsesList()).toMatchObject({ status: "success", data: [{ slug: "marta", name: "Марта" }] });
});

it.each([401, 500, 503])("keeps upstream %s as error for the list", async (status) => {
  fetcher.mockResolvedValue(response({ detail: "error" }, status));
  expect(await loadHorsesList()).toEqual({ status: "error", statusCode: status });
});

it("detail: renders a horse with this_stable: true", async () => {
  fetcher.mockResolvedValueOnce(response(horseItem("marta", { this_stable: true })));
  expect(await loadHorseDetail("marta")).toMatchObject({ status: "success", data: { slug: "marta" } });
});

it("detail (D3 privacy guard): 404s a horse with this_stable: false, even though the backend responded 200", async () => {
  fetcher.mockResolvedValueOnce(response(horseItem("private-boarder", { this_stable: false })));
  expect(await loadHorseDetail("private-boarder")).toEqual({ status: "not-found" });
});

it("detail (D3 privacy guard): 404s a horse with this_stable: null", async () => {
  fetcher.mockResolvedValueOnce(response(horseItem("private-boarder-2", { this_stable: null })));
  expect(await loadHorseDetail("private-boarder-2")).toEqual({ status: "not-found" });
});

it("detail: maps a backend 404 for a nonexistent or another tenant's slug to not-found", async () => {
  fetcher.mockResolvedValueOnce(response({ detail: "Missing" }, 404));
  expect(await loadHorseDetail("missing")).toEqual({ status: "not-found" });
});

it("detail: keeps other upstream failures as error, distinct from not-found", async () => {
  fetcher.mockResolvedValueOnce(response({ detail: "error" }, 503));
  expect(await loadHorseDetail("marta")).toEqual({ status: "error", statusCode: 503 });
});
