import { ConflictException, InternalServerErrorException } from '@nestjs/common';

/**
 * Central mapping from RPC error 'source' strings to local Error instances.
 * Keep all mappings here to avoid touching many files when behavior must change.
 */
export function mapRpcErrorToException(source: string, detail: any): Error {
    const message = typeof detail === 'string' ? detail : JSON.stringify(detail);

    const mapping: Record<string, (detail: any) => Error> = {
        ConflictException: (d) => new ConflictException(d),
        InternalServerErrorException: (d) => new InternalServerErrorException(d),
        // When an RPC reports a QueryFailedError from the DB side, we map it
        // to a ConflictException locally (safe default that accepts a string).
        QueryFailedError: (d) => new ConflictException(d),
    };

    const factory = mapping[source];
    if (factory) return factory(message);

    // Fallback: return a plain Error with the source included in the name so
    // callers can still inspect the original source.
    const err = new Error(message);
    try {
        Object.defineProperty(err, 'name', { value: source });
    } catch {
        // ignore if defineProperty isn't allowed for some reason
    }
    return err;
}

export default mapRpcErrorToException;
