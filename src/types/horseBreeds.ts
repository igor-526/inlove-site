import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType } from "./api";

export type HorseBreedListAvailableSorting =
    | "name"
    | "short_name"
    | "description"
    | "slug"
    | "kind"
    | "created_at"
    | "group_name"
    | "-name"
    | "-short_name"
    | "-description"
    | "-slug"
    | "-kind"
    | "-created_at"
    | "-group_name";

export type HorseBreedGroupIdentityDto = {
    id: UUID;
    name: string;
    slug: string;
};

export type HorseBreedGroupOutDto = ApiCreatedUpdatedAtType & {
    id: UUID;
    name: string;
    slug: string;
};

export type HorseBreedGroupOutWithPageDataDto = HorseBreedGroupOutDto & {
    page_data: string;
};

export type HorseBreedGroupCreateDto = {
    name: string;
    slug?: string | null;
    page_data?: string | null;
};

export type HorseBreedGroupUpdateDto = {
    name?: string | null;
    slug?: string | null;
    page_data?: string | null;
};

export type HorseBreedListQueryParams = {
    name?: string | null;
    short_name?: string | null;
    slug?: string | null;
    description?: string | null;
    page_data?: string | null;
    kind?: ("horse" | "pony")[] | null;
    sort?: HorseBreedListAvailableSorting[] | null;
    breed_group_ids?: UUID[] | null;
    limit?: number | null;
    offset?: number | null;
};

export type HorseBreedDetailQueryParams = {
    page_data?: boolean | null;
};

export type HorseBreedCreateDto = {
    name: string;
    short_name?: string | null;
    slug?: string | null;
    description?: string | null;
    page_data?: string | null;
    kind?: "horse" | "pony" | null;
    breed_group_id?: UUID | null;
};

export type HorseBreedUpdateDto = {
    name?: string | null;
    short_name?: string | null;
    slug?: string | null;
    description?: string | null;
    page_data?: string | null;
    kind?: ("horse" | "pony") | null;
    breed_group_id?: UUID | null;
};

export type HorseBreedOutDto = ApiCreatedUpdatedAtType & {
    id: UUID;
    name: string;
    short_name: string;
    slug: string;
    description?: string | null;
    kind: "horse" | "pony";
    group?: HorseBreedGroupIdentityDto | null;
    page_data?: string;
};

export type HorseBreedOutWithPageDataDto = HorseBreedOutDto & {
    page_data: string;
};

export type BreedGroupIdentityDto = HorseBreedGroupIdentityDto;
export type BreedGroupOutDto = HorseBreedGroupOutDto;
export type BreedGroupOutWithPageDataDto = HorseBreedGroupOutWithPageDataDto;
export type BreedGroupCreateDto = HorseBreedGroupCreateDto;
export type BreedGroupUpdateDto = HorseBreedGroupUpdateDto;
export type BreedCreateDto = HorseBreedCreateDto;
export type BreedUpdateDto = HorseBreedUpdateDto;
export type BreedOutDto = HorseBreedOutDto;
export type BreedOutWithPageDataDto = HorseBreedOutWithPageDataDto;

