import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jose from 'node-jose';
import fetch from 'node-fetch';

@Injectable()
export class JwtGuard implements CanActivate {
    private jwksUrl: string;
    private cachedKeys: jose.JWK.Key[] = [];
    private cacheTime = 5 * 60 * 1000; // 5 minutes
    private lastFetch = 0;

    constructor(private reflector: Reflector, jwksUrl?: string) {
        this.jwksUrl = jwksUrl ?? process.env.AUTH_SERVICE_JWKS_URL ?? 'http://auth-svc/auth/jwks.json';
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];
        const decodedHeader = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());

        if (!decodedHeader?.kid) {
            throw new UnauthorizedException('JWT missing kid header');
        }

        const key = await this.getKey(decodedHeader.kid);

        try {
            const result = await jose.JWS.createVerify(key).verify(token);
            const payload = JSON.parse(result.payload.toString());
            request.user = payload;
            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired JWT');
        }
    }

    private async getKey(kid: string): Promise<jose.JWK.Key> {
        const now = Date.now();
        if (now - this.lastFetch > this.cacheTime || !this.cachedKeys.length) {
            const res = await fetch(this.jwksUrl);
            const jwks = await res.json();
            this.cachedKeys = await Promise.all(jwks.keys.map((jwk: any) => jose.JWK.asKey(jwk)));
            this.lastFetch = now;
        }

        const key = this.cachedKeys.find(k => k.kid === kid);
        if (!key) throw new UnauthorizedException('JWT kid not found in JWKS');

        return key;
    }
}
