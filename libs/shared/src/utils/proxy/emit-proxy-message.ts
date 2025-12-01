import { ClientProxy } from "@nestjs/microservices";
import { timeout, retry } from "rxjs/operators";

export async function emitProxyMessage<TYPE_TO_SEND = { [key: string]: any }>(config: {
    proxy: ClientProxy,
    pattern: string,
    data?: TYPE_TO_SEND,
    options?: {
        retry?: {
            count?: number,
            timeout?: number,
            delay?: number
        }
    }
}): Promise<void> {
    let observable = config.proxy.emit<void, TYPE_TO_SEND>(config.pattern, config?.data || {} as any);

    if (config.options?.retry) {
        observable = observable.pipe(
            timeout(config.options.retry?.timeout || 10000),
            retry({
                count: config?.options?.retry?.count || 2,
                delay: config?.options?.retry?.delay || 1000
            })
        );
    }

    observable.subscribe();
}