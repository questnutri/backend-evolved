import { ClientProxy, RpcException } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { timeout, retry } from "rxjs/operators";
import { ProxyMessage } from "../../types";


export async function sendProxyMessage<TYPE_TO_RECEIVE, TYPE_TO_SEND={[key: string]: any}>(config: {
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
}
): Promise<TYPE_TO_RECEIVE> {
    let observable = config.proxy.send<ProxyMessage<TYPE_TO_RECEIVE>, TYPE_TO_SEND>(config.pattern, config?.data || {} as any);

    if(config.options?.retry) {
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
    if (result && "error" in result) throw new RpcException(result);
    return result.payload;
}