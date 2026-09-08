import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType, ApiPaginationType } from "./api";

export type SiteSettingAvailableSorting =
  | "key"
  | "name"
  | "type"
  | "-key"
  | "-name"
  | "-type";

export enum SiteSettingType {
  string = "string",
  number = "number",
  float = "float",
  boolean = "boolean",
  object = "object",
  date = "date",
  time = "time",
  datetime = "datetime",
}

export type SiteSettingListQueryParams = ApiPaginationType & {
  key?: string | string[];
  name?: string;
  value?: string | null;
  description?: string;
  type?: SiteSettingType[];
  sort?: SiteSettingAvailableSorting[];
  full?: boolean;
};

export type SiteSettingOutDto = ApiCreatedUpdatedAtType & {
  id: UUID;
  key: string;
  value: string;
  name: string;
  description: string | null;
  type: SiteSettingType;
};

export type SiteSettingMiniOutDto = {
  key: string;
  value: string;
  type: string;
};

