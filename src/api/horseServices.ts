import apiFetch, { addQueryParamsToUrl } from "./client";
import { UUID } from "crypto";
import { ApiResult, ApiListPaginatedResponseType, HorseServiceListQueryParams, HorseServiceOutDto } from "@/types";

export const horseServiceList = (
    params: HorseServiceListQueryParams = {},
    options?: RequestInit,
): Promise<ApiResult<ApiListPaginatedResponseType<HorseServiceOutDto>>> => {
    const paramtrizedUrl = addQueryParamsToUrl("/horses/services", params);
    return apiFetch<ApiListPaginatedResponseType<HorseServiceOutDto>>(paramtrizedUrl, options);
};

export const horseServiceDetail = (
    horseServiceId: UUID,
    params?: { page_data?: boolean },
): Promise<ApiResult<HorseServiceOutDto>> => {
    const paramtrizedUrl = addQueryParamsToUrl(`/horses/services/${horseServiceId}`, params || {});
    return apiFetch<HorseServiceOutDto>(paramtrizedUrl, {
        method: "GET",
    });
};
