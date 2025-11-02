import { Module } from '@nestjs/common';
import { AUTH_SERVICE_PROXY_NAME, NUTRITIONIST_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { NutritionistController } from './nutritionist.controller';
import { dbConnection } from '../../database/db-connection';
import { PermissionService } from '../../permission/permission.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [NutritionistController],
    providers: [
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        PermissionService
    ],
})
export class NutritionistModule { }
