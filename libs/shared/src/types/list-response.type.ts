export type ListResponse<T> = {
    items: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    lastPage: boolean;
    firstPage: boolean;
    exceededLastPage: boolean;
    itemsLength: number;
    limit: number;
};