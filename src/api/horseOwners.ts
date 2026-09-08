import apiFetch, { addQueryParamsToUrl } from "./client";
import { UUID } from "crypto";
import { ApiResult, ApiListPaginatedResponseType, HorseOwnerListQueryParams, HorseOwnerOutDto } from "@/types";

export const horseOwnerList = (
    params: HorseOwnerListQueryParams = {},
    options?: RequestInit,
): Promise<ApiResult<ApiListPaginatedResponseType<HorseOwnerOutDto>>> => {
    const paramtrizedUrl = addQueryParamsToUrl("/horses/owners", params);
    return apiFetch<ApiListPaginatedResponseType<HorseOwnerOutDto>>(paramtrizedUrl, options);
};

export const horseOwnerDetail = (
    horseOwnerId: UUID,
): Promise<ApiResult<HorseOwnerOutDto>> => {
    return apiFetch<HorseOwnerOutDto>(`/horses/owners/${horseOwnerId}`, {
        method: "GET",
    });
};

