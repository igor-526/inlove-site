export type BooleanFilterType = 'true' | 'false' | null | undefined;

export type ApiPaginationType = {
    limit?: number;
    offset?: number;
}

export type ApiCreatedUpdatedAtType = {
    created_at: string;
    updated_at: string | null;
}

export type ApiListPaginatedResponseType<T> = {
    total: number,
    items: T[]
}

export type DetailResponse = {
    detail: string;
};

export type ApiSuccess<T> = {
    status: "ok";
    data: T | null;
};

export type ApiError = {
    status: "error";
    data: DetailResponse;
    statusCode?: number;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

