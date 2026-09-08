import type { UUID } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { horseDetail, horseList } from "./horse";
import { horseBreedDetail, horseBreedList } from "./horseBreeds";
import { horseCoatColorDetail, horseCoatColorList } from "./horseCoatColor";
import { horseOwnerDetail, horseOwnerList } from "./horseOwners";
import { horseServiceDetail, horseServiceList } from "./horseServices";
import { priceDetail, priceList } from "./price";
import { priceGroupDetail, priceGroupList } from "./priceGroups";
import { siteSettingDetail, siteSettingList } from "./siteSettings";

const originalEnv = process.env;
const entityId = "123e4567-e89b-12d3-a456-426614174000" as UUID;

type WrapperCase = {
  wrapper: string;
  expectedUrl: string;
  invoke: () => Promise<unknown>;
};

const wrappers: WrapperCase[] = [
  {
    wrapper: "horseList",
    expectedUrl: "https://api.example.test/api/horses?name=Storm&kind=horse&kind=pony&limit=12&offset=3",
    invoke: () => horseList({ name: "Storm", kind: ["horse", "pony"], limit: 12, offset: 3 }),
  },
  {
    wrapper: "horseDetail",
    expectedUrl: "https://api.example.test/api/horses/storm?pedigree=2",
    invoke: () => horseDetail("storm", { pedigree: 2 }),
  },
  {
    wrapper: "horseBreedList",
    expectedUrl: "https://api.example.test/api/horses/breeds?name=Arabian&kind=horse&limit=10",
    invoke: () => horseBreedList({ name: "Arabian", kind: ["horse"], limit: 10 }),
  },
  {
    wrapper: "horseBreedDetail",
    expectedUrl: `https://api.example.test/api/horses/breeds/${entityId}?page_data=true`,
    invoke: () => horseBreedDetail(entityId, { page_data: true }),
  },
  {
    wrapper: "horseCoatColorList",
    expectedUrl: "https://api.example.test/api/horses/coat_colors?name=Bay&limit=8&offset=1",
    invoke: () => horseCoatColorList({ name: "Bay", limit: 8, offset: 1 }),
  },
  {
    wrapper: "horseCoatColorDetail",
    expectedUrl: `https://api.example.test/api/horses/coat_colors/${entityId}?page_data=true`,
    invoke: () => horseCoatColorDetail(entityId, { page_data: true }),
  },
  {
    wrapper: "horseOwnerList",
    expectedUrl: "https://api.example.test/api/horses/owners?name=Owner&limit=6&offset=2",
    invoke: () => horseOwnerList({ name: "Owner", limit: 6, offset: 2 }),
  },
  {
    wrapper: "horseOwnerDetail",
    expectedUrl: `https://api.example.test/api/horses/owners/${entityId}`,
    invoke: () => horseOwnerDetail(entityId),
  },
  {
    wrapper: "horseServiceList",
    expectedUrl: "https://api.example.test/api/horses/services?name=Training&slug=training&limit=5",
    invoke: () => horseServiceList({ name: "Training", slug: "training", limit: 5 }),
  },
  {
    wrapper: "horseServiceDetail",
    expectedUrl: `https://api.example.test/api/horses/services/${entityId}?page_data=true`,
    invoke: () => horseServiceDetail(entityId, { page_data: true }),
  },
  {
    wrapper: "priceList",
    expectedUrl: "https://api.example.test/api/prices?name=Boarding&groups=stable&groups=training&limit=7",
    invoke: () => priceList({ name: "Boarding", groups: ["stable", "training"], limit: 7 }),
  },
  {
    wrapper: "priceDetail",
    expectedUrl: "https://api.example.test/api/prices/full-board?page_data=true",
    invoke: () => priceDetail("full-board", { page_data: true }),
  },
  {
    wrapper: "priceGroupList",
    expectedUrl: "https://api.example.test/api/prices/groups?name=Stable&limit=4&offset=1",
    invoke: () => priceGroupList({ name: "Stable", limit: 4, offset: 1 }),
  },
  {
    wrapper: "priceGroupDetail",
    expectedUrl: `https://api.example.test/api/prices/groups/${entityId}`,
    invoke: () => priceGroupDetail(entityId),
  },
  {
    wrapper: "siteSettingList",
    expectedUrl: "https://api.example.test/api/site_settings?key=phone&key=email&limit=9&full=false",
    invoke: () => siteSettingList({ key: ["phone", "email"], limit: 9 }),
  },
  {
    wrapper: "siteSettingDetail",
    expectedUrl: `https://api.example.test/api/site_settings/${entityId}`,
    invoke: () => siteSettingDetail(entityId),
  },
];

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("retained Public Read wrappers (UT-IL-01)", () => {
  it.each(wrappers)("$wrapper uses its exact GET path/query and selector", async ({ expectedUrl, invoke }) => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
    process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY = " inlove ";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "{}",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(invoke()).resolves.toEqual({ status: "ok", data: {} });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);

    expect(url).toBe(expectedUrl);
    expect(options.method?.toUpperCase() ?? "GET").toBe("GET");
    expect(headers.get("X-Equestrian-Service-Key")).toBe("inlove");
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("Cookie")).toBe(false);
    expect(options.credentials).toBe("omit");
  });
});
