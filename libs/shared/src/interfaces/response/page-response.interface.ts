export interface PageResponse<T> {
    currentPage: number;
    length: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    totalPages: number;
    totalItems: number;
    data: T[];
}