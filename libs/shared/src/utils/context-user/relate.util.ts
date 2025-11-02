import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@backend-evolved/shared";
import { ContextUser } from "./context-user";

export type RelatedLocation = 'body' | 'params' | 'query' | 'headers';
export type IsRelatedOptions = {
    on?: RelatedLocation;                 // default: 'body'
    withKeys: string[];                   // keys to check (any match -> allowed)
    adminBypass?: boolean;                // default: true
    errorMessage?: (role: UserRole) => string;
};

export type ContextUserDecoratorData = {
    isRelated?: IsRelatedOptions;
} | undefined;


export function isUserRelated(
    user: ContextUser,
    requestOrCtx: any,
    opts: IsRelatedOptions
): boolean {
    const request = requestOrCtx && typeof requestOrCtx.switchToHttp === 'function'
        ? requestOrCtx.switchToHttp().getRequest()
        : requestOrCtx;

    const location: RelatedLocation = opts.on ?? 'body';
    const source = (request && request[location]) ?? {};
    const adminBypass = opts.adminBypass !== false;

    if (adminBypass && user.role === UserRole.ADMIN) {
        return true;
    }

    for (const key of opts.withKeys) {
        const val = source?.[key];
        if (val != null && String(val) === String(user.id)) {
            return true;
        }
    }

    return false;
}

export function ensureUserRelatedOrThrow(
    user: ContextUser,
    requestOrCtx: any,
    opts: IsRelatedOptions
): void {
    if (!isUserRelated(user, requestOrCtx, opts)) {
        const msg = opts.errorMessage ? opts.errorMessage(user.role) : 'User is not allowed to access this resource (context bind mismatch).';
        throw new ForbiddenException(msg);
    }
}