import { CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, mixin, Type } from '@nestjs/common'
import * as jose from 'node-jose'
import fetch from 'node-fetch'

export const JwtRoleGuard = (allowedRoles?: string[]): Type<CanActivate> => {
    class JwtRoleGuardMixin implements CanActivate {
        public url = process.env.AUTH_SERVICE_JWKS_URL ?? 'http://localhost:3032/auth/jwks.json'
        public cachedKeys: jose.JWK.Key[] = []
        public cacheTime = 5 * 60 * 1000
        public lastFetch = 0

        async canActivate(context: ExecutionContext): Promise<boolean> {
            const request = context.switchToHttp().getRequest()
            const headers = request.headers
            const authHeader = headers['authorization']

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedException('Missing or invalid Authorization header')
            }

            const token = authHeader.split(' ')[1]
            const decodedHeader = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString())

            if (decodedHeader?.alg !== 'RS256') {
                throw new UnauthorizedException('Invalid JWT algorithm, expected RS256')
            }

            const key = await this.getKey(decodedHeader?.kid)

            try {
                const result = await jose.JWS.createVerify(key).verify(token)
                const payload = JSON.parse(result.payload.toString())

                const now = Math.floor(Date.now() / 1000)
                if (payload.exp && payload.exp < now) {
                    throw new UnauthorizedException('JWT expired')
                }

                if (payload.role && payload.sub) {
                    headers['role'] = payload.role
                    headers['user-id'] = payload.sub
                }

                if (allowedRoles && allowedRoles.length > 0) {
                    if (!payload.role || !allowedRoles.includes(payload.role)) {
                        throw new ForbiddenException('You do not have permission to access this resource')
                    }
                }

                return true
            } catch {
                throw new UnauthorizedException('Invalid or expired JWT')
            }
        }

        private async getKey(kid?: string): Promise<jose.JWK.Key> {
            const now = Date.now()
            if (now - this.lastFetch > this.cacheTime || !this.cachedKeys.length) {
                const res = await fetch(this.url)
                const jwks = await res.json()
                this.cachedKeys = await Promise.all(jwks.keys.map((jwk: any) => jose.JWK.asKey(jwk)))
                this.lastFetch = now
            }

            const key = kid ? this.cachedKeys.find(k => k.kid === kid) : this.cachedKeys[0]
            if (!key) throw new UnauthorizedException('JWT key not found in JWKS')
            return key
        }
    }

    return mixin(JwtRoleGuardMixin)
}
