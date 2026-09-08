import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType, ApiPaginationType } from "./api";

export type PriceGroupAvailableSorting = 'name' | '-name';

export type PriceGroupListQueryParams = ApiPaginationType & {
    name?: string | null;
    description?: string | null;
    sort?: PriceGroupAvailableSorting[];
};

export type PriceGroupSimpleOutDto = {
    id: UUID;
    name: string;
}

export type PriceGroupOutDto = ApiCreatedUpdatedAtType & PriceGroupSimpleOutDto & {
    description: string | null;
} | null;
