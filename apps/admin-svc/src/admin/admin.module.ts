import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AUTH_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [AdminController],
    providers: [
        AdminService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME)
    ],
})
export class AdminModule { }
