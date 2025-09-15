// key.service.ts
import { Injectable } from '@nestjs/common';
import { generateKeyPairSync } from 'crypto';
import * as jose from 'node-jose';

@Injectable()
export class KeyService {
    private privateKey: string;
    private publicKey: string;
    private jwk: any;

    constructor() {
        // Check if env vars exist
        const envPrivateKey = process.env.AUTH_PRIVATE_KEY;
        const envPublicKey = process.env.AUTH_PUBLIC_KEY;

        if (envPrivateKey && envPublicKey) {
            this.privateKey = envPrivateKey;
            this.publicKey = envPublicKey;
        } else {
            const { publicKey, privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });
            this.privateKey = privateKey;
            this.publicKey = publicKey;
        }
        
    }

    async getJwk() {
        if (!this.jwk) {
            const key = await jose.JWK.asKey(this.publicKey, 'pem');
            this.jwk = key.toJSON();
        }
        return this.jwk;
    }

    getPrivateKey(): string {
        return this.privateKey;
    }

    getPublicKey(): string {
        return this.publicKey;
    }
}
