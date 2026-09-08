import apiFetch, { addQueryParamsToUrl } from "./client";
import { ApiResult, ApiListPaginatedResponseType, PriceGroupListQueryParams, PriceGroupOutDto } from "@/types";
import { UUID } from "crypto";

export const priceGroupList = (
    params: PriceGroupListQueryParams = {},
    options?: RequestInit,
): Promise<ApiResult<ApiListPaginatedResponseType<PriceGroupOutDto>>> => {
    const paramtrizedUrl = addQueryParamsToUrl("/prices/groups", params);
    return apiFetch<ApiListPaginatedResponseType<PriceGroupOutDto>>(paramtrizedUrl, options);
};

export const priceGroupDetail = (
    priceGroupId: UUID,
): Promise<ApiResult<PriceGroupOutDto>> => {
    return apiFetch<PriceGroupOutDto>(`/prices/groups/${priceGroupId}`, {
        method: "GET",
    });
};
