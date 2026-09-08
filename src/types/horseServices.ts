import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType, ApiPaginationType } from "./api";
import { PriceFormatter } from "./prices";

export type HorseServiceAvailableSorting = 'name' | 'description' | 'slug' | '-name' | '-description' | '-slug';

export type HorseServiceListQueryParams = ApiPaginationType & {
    name?: string;
    slug?: string;
    description?: string;
    page_data?: string;
    sort?: HorseServiceAvailableSorting[];
};

export type HorseServiceDetailQueryParams = {
    page_data?: boolean;
};

export type HorseServiceOutDto = ApiCreatedUpdatedAtType & {
    id: UUID;
    name: string;
    slug: string;
    description: string;
    price: number;
    price_formatter?: PriceFormatter;
    page_data?: string;
};
