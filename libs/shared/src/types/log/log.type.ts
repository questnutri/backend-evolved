import { EventOrigin } from "../../enums"

export type LogRecord = {
    origin: EventOrigin.CONTROLLER,
    controller: string,
    method: string,
    statusCode: number,
    path: string,
    handler: string,
    ip: string,
    response: any,
    user: any,
    timestamp: string
} | {
    origin: EventOrigin.PROXY
}