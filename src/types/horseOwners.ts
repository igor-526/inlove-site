import { UUID } from "crypto";
import { ApiCreatedUpdatedAtType } from "./api";

export type HorseOwnerType = "person" | "company";

export type HorseOwnerListAvalableSortings = "name" | "description" | "type" | "-name" | "-description" | "-type"

export type HorseOwnerListQueryParams = {
    name?: string | null //регистронезависимый фильтр по вхождению наименования
    description?: string | null //регистронезависимый фильтр по вхождению описания
    type?: HorseOwnerType[] | null //фильтрация по типу (логика OR)
    address?: string | null //регистронезависимый фильтр по вхождению адреса
    phone_numbers?: string | null //фильтрация по номеру телефона
    sort?: HorseOwnerListAvalableSortings[] //список полей сортировки по приоритету
    limit?: number | null //[min=1 max=100 default=25] количество запсией
    offset?: number | null //[min=0 default=0] отступ записей
}

export type HorseOwnerOutDto = ApiCreatedUpdatedAtType & {
    id: UUID //UUID
    name: string //наименование
    description: string | null //описание
    type: HorseOwnerType //тип
    address: string | null //адрес
    phone_numbers: string[] //номера телефонов в формате "+7 (999) 123-45-67
}
