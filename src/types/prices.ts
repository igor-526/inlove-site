import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType, ApiPaginationType } from "./api";
import { PhotoOutShortDto } from "./photos";
import { PriceGroupSimpleOutDto } from "./priceGroups";
import { TableType } from "./table";

export type PriceAvailableSorting = 'name' | '-name';

export enum PriceFormatter {
    equal = 'equal',
    gt = 'gt',
    lt = 'lt',
    discuss = 'discuss',
}

export type PriceListQueryParams = ApiPaginationType & {
    name?: string | string[] | null;
    description?: string | null;
    groups?: string | string[] | null;
    sort?: PriceAvailableSorting[] | null;
};

export type PriceQueryParams = {
    page_data?: boolean | null;
};

export type PriceOutDto = ApiCreatedUpdatedAtType & {
    id: UUID;
    name: string;
    slug: string;
    description: string | null;
    photos: PhotoOutShortDto[];
    groups: PriceGroupSimpleOutDto[];
    price_tables: TableType[];
    page_data?: string | null;
};

export type PriceOutWithTablesDto = PriceOutDto;
