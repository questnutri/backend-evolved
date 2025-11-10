import { ClientProxy, RpcException } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { timeout, retry } from "rxjs/operators";
import { ProxyMessage } from "../../types";
import { ContextLog } from "../context-log/context-log";

type INJECT_LOG_CONTEXT<DATA = any> = DATA & { 'log-id'?: string };

export async function sendProxyMessage<TYPE_TO_RECEIVE, TYPE_TO_SEND = { [key: string]: any }>(config: {
    proxy: ClientProxy,
    pattern: string,
    data?: TYPE_TO_SEND,
    options?: {
        retry?: {
            count?: number,
            timeout?: number,
            delay?: number
        }
    },
    contextLog?: ContextLog
}
): Promise<TYPE_TO_RECEIVE> {
    const data: INJECT_LOG_CONTEXT<TYPE_TO_SEND> = config.data || {} as any;
    if (config.contextLog && config.contextLog.id) {
        data['log-id'] = config.contextLog.id;
    }

    console.log(`[sendProxyMessage] Sending to pattern: ${config.pattern} with log-id: ${data['log-id']} at ${Date.now()}`);

    await config.proxy.connect();
    let observable = config.proxy.send<ProxyMessage<TYPE_TO_RECEIVE>, INJECT_LOG_CONTEXT<TYPE_TO_SEND>>(config.pattern, data);

    if (config.options?.retry) {
        observable = observable.pipe(
            timeout(config.options.retry?.timeout || 10000),
            retry({
                count: config?.options?.retry?.count || 2,
                delay: config?.options?.retry?.delay || 1000
            })
        )
    }

    const result = await firstValueFrom(
        observable
    );
    await config.proxy.close();

    console.log(`[sendProxyMessage] result of call ${config.pattern} at ${Date.now()}:`, result);

    if (result && "error" in result) throw new RpcException(result);
    return result.payload;
}