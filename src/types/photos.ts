import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType, ApiPaginationType } from "./api";

export type PhotoAvailableSorting = 'name' | '-name' | 'description' | '-description';

export type PhotoListQueryParams = ApiPaginationType & {
    name?: string;
    description?: string;
    sort?: PhotoAvailableSorting[];
};

export type PhotoOutShortDto = {
    id: UUID;
    is_main: boolean;
    url: string;
};

export type PhotoOutDto = ApiCreatedUpdatedAtType & {
    id: UUID;
    name: string;
    description: string | null;
    path: string;
    url: string;
};
