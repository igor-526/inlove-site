import { UUID } from "crypto"
import { HorseBreedOutDto } from "./horseBreeds"
import { HorseCoatColorOutDto } from "./horseCoatColor"
import { HorseOwnerOutDto } from "./horseOwners"
import { PhotoOutShortDto } from "./photos"
import { HorseServiceOutDto } from "./horseServices"
import { ApiCreatedUpdatedAtType } from "./api"

export type HorseListAvailableSorting =
  "name" | "breed_name" | "coat_color_name" | "kind" | "height" | "sex" | "bdate" | "ddate" | "this_stable" | "created_at" |
  "-name" | "-breed_name" | "-coat_color_name" | "-kind" | "-height" | "-sex" | "-bdate" | "-ddate" | "-this_stable" | "-created_at"

export type HorseListQueryParams = {
  name?: string | null //регистронезависимая фильтрация по вхождению клички лошади
  description?: string | null //регистронезависимая фильтрация по вхождению описания лошади
  breed_ids?: UUID[] | null //фильтр по UUID пород (логика OR)
  coat_color_ids?: UUID[] | null //фильтр по UUID мастей (логика OR)
  kind?: ("horse" | "pony")[] | null //
  height_gte?: number | null //минимальный рост лошади
  height_lte?: number | null //максимальный рост лошади
  sex?: ("male" | "female" | "geld")[] | null //фильтр пола лошади (логика OR)
  bdate_gte?: string | null //минимальная дата рождения лошади (формат YYYY-MM-DD)
  bdate_lte?: string | null //максимальная дата рождения лошади (формат YYYY-MM-DD)
  ddate_gte?: string | null //минимальная дата смерти лошади (формат YYYY-MM-DD)
  ddate_lte?: string | null //максимальная дата смерти лошади (формат YYYY-MM-DD)
  horse_owner_ids?: UUID[] | null //фильтр по UUID владельцев (логика OR)
  services?: UUID[] | null //фильтр по UUID оказываемых услуг (логика OR)
  service_names?: string[] | null //фильтр по наименованиям услуг (регистронезависимое полное совпадение) (логика OR)
  this_stable?: boolean | null //фильтр по местонахождению лошади на данной конюшни
  exclude_ids?: UUID[] | null //исключить UUID лошадей
  include_ids?: UUID[] | null //искать только среди этих UUID лошадей
  pedigree?: number | null //[min=0 max=3] количество поколений для вывода
  limit?: number | null //[min=1 max=100 default=25]количество записей для вывода
  offset?: number | null //[min=0 default=0] отступ для пагинации
  sort?: HorseListAvailableSorting[] | null //список полей сортировки по приоритету
}

export type HorseDetailQueryParams = {
  pedigree?: number | null //[min=0 max=3] количество поколений для вывода
}

export type FoalParentRefDto = {
  id: UUID      // UUID производителя
  name: string  // кличка производителя
}

export type FoalParentsDto = {
  sire: FoalParentRefDto | null  // отец жеребёнка
  dam: FoalParentRefDto | null   // мать жеребёнка
}

export type HorseFoalOutDto = HorseOutDto & {
  parents: FoalParentsDto  // первое поколение производителей
}

export type HorsePedigreeOutDto = {
  sire: HorseOutDto | null //отец
  dam: HorseOutDto | null //мать
  foals: HorseFoalOutDto[] //жеребята
}

export type HorseOutDto = ApiCreatedUpdatedAtType & {
  id: UUID //UUID
  slug: string //буквенный идентификатор
  name: string //кличка
  code?: string | null //код лошади
  description?: string | null //описание
  breed?: HorseBreedOutDto | null //порода
  coat_color?: HorseCoatColorOutDto | null //масть
  kind: "horse" | "pony" //тип
  height?: number | null //рост
  sex: "male" | "female" | "geld" //пол
  bdate?: string | null //[ТОЛЬКО АДМИН] дата рождения в формате YYYY-MM-DD
  ddate?: string | null //[ТОЛЬКО АДМИН] дата смерти в формате YYYY-MM-DD
  bdate_mode?: "y" | "ym" | "ymd" | "hide" //формат отображения даты рождения
  ddate_mode?: "y" | "ym" | "ymd" | "hide" //формат отображения даты смерти
  horse_owner?: HorseOwnerOutDto | null //владелец
  photos?: PhotoOutShortDto[] //фотографии
  services?: HorseServiceOutDto[] //связанные услуги
  this_stable: boolean //базируется ли на этой конюшне
  bdate_formatted: string | null //форматированная для вывода дата рождения
  ddate_formatted: string | null //форматированная для вывода дата смерти
  age: number | null //возраст в годах
  pedigree?: HorsePedigreeOutDto //[ТОЛЬКО ПРИ ПЕРЕДАЧЕ pedigree] родословная
}




