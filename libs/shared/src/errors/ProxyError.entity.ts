import { RpcException } from "@nestjs/microservices";

export class ProxyError extends RpcException {
    constructor(source: string, detail: string, information: any, error?: unknown) {
        super({
            error: true,
            source,
            message: detail,
            details: information,
            original: error
        })
    }
}