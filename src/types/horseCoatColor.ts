import { UUID } from "crypto";
import { HorseBreedListAvailableSorting } from "./horseBreeds";
import { ApiCreatedUpdatedAtType } from "./api";

export type HorseCoatColorListAvailableSorting = "name" | "description" | "slug" | "-name" | "-description" | "-slug"

export type HorseCoatColorListQueryParams = {
    name?: string | null //регистронезависимый поиск по вхождению наименования
    description?: string | null //регистронезависимый поиск по вхождению описания
    sort?: HorseBreedListAvailableSorting[] | null //список полей для сортировки по приоритету
    limit?: number | null //[min=1 max=100 default=50] //количество записей для вывода
    offset?: number | null //[min=0 default=0] //отступ записей
}

export type HorseCoatColorDetailQueryParams = {
    page_data?: boolean | null //[default=false] выводить ли контент страницы
}

export type HorseCoatColorOutDto = ApiCreatedUpdatedAtType & {
    id: UUID //UUID
    name: string //наименование
    short_name: string | null //короткое наименование
    slug: string //буквенный идентификатор
    description: string | null //описание
    page_data?: string //[ПРИ page_data=true] контент страницы в формате HTML
}
