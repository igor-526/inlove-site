import apiFetch, { addQueryParamsToUrl } from "./client";
import { UUID } from "crypto";
import { ApiResult, SiteSettingListQueryParams, SiteSettingOutDto, SiteSettingMiniOutDto } from "@/types";

export const siteSettingList = (
    params: SiteSettingListQueryParams = {},
    options?: RequestInit,
): Promise<ApiResult<SiteSettingMiniOutDto[] | null>> => {
    params.full = false;
    const paramtrizedUrl = addQueryParamsToUrl("/site_settings", params);
    return apiFetch<SiteSettingMiniOutDto[] | null>(paramtrizedUrl, options);
};

export const siteSettingDetail = (
    siteSettingId: UUID,
): Promise<ApiResult<SiteSettingOutDto | null>> => {
    return apiFetch<SiteSettingOutDto | null>(`/site_settings/${siteSettingId}`, {
        method: "GET",
    });
};
