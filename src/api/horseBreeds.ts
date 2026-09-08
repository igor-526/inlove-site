import apiFetch, { addQueryParamsToUrl } from "./client";
import { UUID } from "crypto";
import { ApiResult, ApiListPaginatedResponseType, HorseBreedListQueryParams, HorseBreedOutDto } from "@/types";

export const horseBreedList = (
    params: HorseBreedListQueryParams = {},
    options?: RequestInit,
): Promise<ApiResult<ApiListPaginatedResponseType<HorseBreedOutDto>>> => {
    const paramtrizedUrl = addQueryParamsToUrl("/horses/breeds", params);
    return apiFetch<ApiListPaginatedResponseType<HorseBreedOutDto>>(paramtrizedUrl, options);
};

export const horseBreedDetail = (
    horseBreedId: UUID,
    params?: { page_data?: boolean },
): Promise<ApiResult<HorseBreedOutDto>> => {
    const paramtrizedUrl = addQueryParamsToUrl(`/horses/breeds/${horseBreedId}`, params || {});
    return apiFetch<HorseBreedOutDto>(paramtrizedUrl, {
        method: "GET",
    });
};
