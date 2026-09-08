import apiFetch, { addQueryParamsToUrl } from "./client";
import { UUID } from "crypto";
import { ApiResult, ApiListPaginatedResponseType, HorseCoatColorListQueryParams, HorseCoatColorOutDto } from "@/types";

export const horseCoatColorList = (
    params: HorseCoatColorListQueryParams = {},
    options?: RequestInit,
): Promise<ApiResult<ApiListPaginatedResponseType<HorseCoatColorOutDto>>> => {
    const paramtrizedUrl = addQueryParamsToUrl("/horses/coat_colors", params);
    return apiFetch<ApiListPaginatedResponseType<HorseCoatColorOutDto>>(paramtrizedUrl, options);
};

export const horseCoatColorDetail = (
    horseCoatColorId: UUID,
    params?: { page_data?: boolean },
): Promise<ApiResult<HorseCoatColorOutDto>> => {
    const paramtrizedUrl = addQueryParamsToUrl(`/horses/coat_colors/${horseCoatColorId}`, params || {});
    return apiFetch<HorseCoatColorOutDto>(paramtrizedUrl, {
        method: "GET",
    });
};
