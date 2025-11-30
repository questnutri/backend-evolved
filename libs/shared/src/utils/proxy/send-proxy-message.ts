import { ClientOptions, ClientProxy, ClientProxyFactory, RpcException, Transport } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { timeout, retry } from "rxjs/operators";
import { ProxyMessage } from "../../types";
import { provideRabbitMqConnection } from "../providers/provide-rabbitmq-connection";

let loggingProxy: ClientProxy | null = null;

function getLoggingProxy(): ClientProxy {
    if (!loggingProxy) {
        loggingProxy = ClientProxyFactory.create(
            provideRabbitMqConnection('log_queue') as ClientOptions
        );
    }
    return loggingProxy;
}

export async function sendProxyMessage<TYPE_TO_RECEIVE, TYPE_TO_SEND = { [key: string]: any }>(config: {
    proxy: ClientProxy,
    pattern: string,
    data?: TYPE_TO_SEND,
    options?: {
        retry?: {
            count?: number,
            timeout?: number,
            delay?: number
        },
        rawResponse?: boolean,
        dontThrowIfError?: boolean
    }
}
): Promise<TYPE_TO_RECEIVE> {
    // console.log('[SEND-PROXY-MESSAGE] Sending message with pattern:', config.pattern, 'and data:', config.data);
    let observable = config.proxy.send<ProxyMessage<TYPE_TO_RECEIVE>, TYPE_TO_SEND>(config.pattern, config?.data || {} as any);

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

    try {
        const logProxy = getLoggingProxy();
        logProxy.emit('log.message', {
            pattern: config.pattern,
            timestamp: new Date().toISOString(),
            data: config.data,
            result
        });
    } catch (error) {
        console.error('[LOGGING] Failed to send log:', error);
    }

    if (result && "error" in result) {
        if (config.options?.dontThrowIfError) return result as any;
        throw new RpcException(result);
    };
    if (config.options?.rawResponse) return result as any;
    return result.payload;
}