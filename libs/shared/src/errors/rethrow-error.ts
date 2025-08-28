import { ErrorRegistry } from "./error-registry";

export function rethrowError(error: unknown) {
    console.log('Rethrow: ', error);
    if (isRpcError(error)) {
        console.log('isRcpError')
        const ErrorClass = ErrorRegistry[error.source];
        if (ErrorClass) {
            throw new ErrorClass(error.detail);
        } else {
            throw new Error(`Unhandled error source: ${error.source}. Detail: ${error.detail}`);
        }
    } else {
        throw new Error(`Unknown error format: ${JSON.stringify(error)}`);
    }
}

function isRpcError(obj: unknown): obj is { source: string; detail: string } {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'source' in obj &&
        'detail' in obj &&
        typeof (obj as any).source === 'string' &&
        typeof (obj as any).detail === 'string'
    );
}