import apiFetch, { addQueryParamsToUrl } from "./client";

import {
  ApiResult,
  ApiListPaginatedResponseType,
  PriceListQueryParams,
  PriceOutWithTablesDto,
  PriceQueryParams,
} from "@/types";

export const priceList = (
  params: PriceListQueryParams = {},
  options?: RequestInit
): Promise<ApiResult<ApiListPaginatedResponseType<PriceOutWithTablesDto>>> => {
  const paramtrizedUrl = addQueryParamsToUrl("/prices", params);
  return apiFetch<ApiListPaginatedResponseType<PriceOutWithTablesDto>>(
    paramtrizedUrl,
    options
  );
};

export const priceDetail = (
  priceSlug: string,
  params?: PriceQueryParams
): Promise<ApiResult<PriceOutWithTablesDto>> => {
  const paramtrizedUrl = addQueryParamsToUrl(
    `/prices/${priceSlug}`,
    params || {}
  );
  return apiFetch<PriceOutWithTablesDto>(paramtrizedUrl, {
    method: "GET",
  });
};

