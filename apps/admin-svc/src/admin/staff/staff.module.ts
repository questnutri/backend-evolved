import { Module } from '@nestjs/common';
import { AUTH_SERVICE_PROXY_NAME, NUTRITIONIST_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { StaffController } from './staff.controller';
import { AdminService } from '../admin.service';
import { dbConnection } from '../../database/db-connection';
import { PermissionService } from '../../permission/permission.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [StaffController],
    providers: [
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        AdminService,
        PermissionService
    ],
})
export class StaffModule { }
