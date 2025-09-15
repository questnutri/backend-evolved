import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { provideTypeOrmDbConnection, RefreshToken, User } from '@backend-evolved/shared';
import { JwtModule } from '@nestjs/jwt';
import { KeyService } from '../key/key.service';
import { KeyModule } from '../key/key.module';

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
        provideTypeOrmDbConnection(
            process.env.AUTH_SERVICE_DATABASE_PORT || '5432',
            process.env.AUTH_SERVICE_DATABASE_HOST || 'localhost',
            [User, RefreshToken],
            false
        )
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule { }
