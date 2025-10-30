import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRestController } from './auth-rest.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { KeyService } from '../key/key.service';
import { KeyModule } from '../key/key.module';
import { dbConnection } from '../database/db-connection';
import { TokenService } from './token.service';
import { UserService } from './user.service';
import { AuthProxyController } from './auth-proxy.controller';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        KeyModule,
        JwtModule.registerAsync({
            imports: [ConfigModule, KeyModule],
            inject: [KeyService],
            useFactory: (keyService: KeyService) => ({
                privateKey: keyService.getPrivateKey(),
                signOptions: { algorithm: 'RS256', expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
            }),
        }),
        dbConnection(),
    ],
    controllers: [
        AuthRestController,
        AuthProxyController
    ],
    providers: [
        AuthService,
        TokenService,
        UserService
    ],
})
export class AuthModule { }
