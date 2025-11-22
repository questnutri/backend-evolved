export class SearchDto<T> {
    where?: any;
    relations?: string[];
    removeKeys?: (keyof T)[];
    select?: (keyof T)[];
    filter?: any;
}