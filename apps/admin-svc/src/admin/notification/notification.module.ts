import { Module } from '@nestjs/common';
import { dbConnection } from '../../database/db-connection';
import { PermissionService } from '../../permission/permission.service';
import { NotificationController } from './notification.controller';
import {
    provideProxyService,
    AUTH_SERVICE_PROXY_NAME,
    NUTRITIONIST_SERVICE_PROXY_NAME,
    PATIENT_SERVICE_PROXY_NAME,
    NOTIFICATION_SERVICE_PROXY_NAME
} from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [NotificationController],
    providers: [
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        provideProxyService(NOTIFICATION_SERVICE_PROXY_NAME),
        PermissionService
    ],
})
export class NotificationModule { }
