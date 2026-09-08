import apiFetch, { addQueryParamsToUrl } from "./client";

import {
    ApiResult,
    HorseOutDto,
    HorseListQueryParams,
    HorseDetailQueryParams,
    ApiListPaginatedResponseType,
} from "@/types";

export const horseList = (
    params: HorseListQueryParams = {},
    options?: RequestInit
): Promise<ApiResult<ApiListPaginatedResponseType<HorseOutDto>>> => {
    const paramtrizedUrl = addQueryParamsToUrl("/horses", params);
    return apiFetch<ApiListPaginatedResponseType<HorseOutDto>>(
        paramtrizedUrl,
        options
    );
};

export const horseDetail = (
    horseSlug: string,
    params?: HorseDetailQueryParams
): Promise<ApiResult<HorseOutDto>> => {
    const paramtrizedUrl = addQueryParamsToUrl(
        `/horses/${horseSlug}`,
        params || {}
    );
    return apiFetch<HorseOutDto>(paramtrizedUrl, {
        method: "GET",
    });
};
