import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { provideTypeOrmDbConnection, RefreshToken, User } from '@backend-evolved/shared';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [],
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
            }),
        }),
        provideTypeOrmDbConnection(
            process.env.AUTH_SERVICE_DATABASE_PORT || '5432',
            [User, RefreshToken]
        )
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule { }
