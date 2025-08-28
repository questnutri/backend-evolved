export type ProxyMessage<T> = {
    payload: T;
} | {
    error: true;
    detail: string;
    source: string;
}