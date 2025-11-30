import { EventOrigin } from "../../enums"

export type LogRecord<T = any> = {
    origin: EventOrigin.CONTROLLER,
    controller: string,
    method: string,
    statusCode: number,
    path: string,
    handler: string,
    ip: string,
    data: T,
    user: any,
    timestamp: string
} | {
    origin: EventOrigin.PROXY
}