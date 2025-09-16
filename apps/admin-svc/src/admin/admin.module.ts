import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AUTH_SERVICE_PROXY_NAME, JwtGuard, provideProxyService } from '@backend-evolved/shared';

@Module({
    controllers: [AdminController],
    providers: [
        AdminService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME)
    ],
})
export class AdminModule { }
