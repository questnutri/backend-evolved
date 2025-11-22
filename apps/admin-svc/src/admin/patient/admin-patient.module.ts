import { Module } from '@nestjs/common';
import { PatientController } from './admin-patient.controller';
import { PermissionService } from '../../permission/permission.service';
import { dbConnection } from '../../database/db-connection';
import { AUTH_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        PatientController
    ],
    providers: [
        PermissionService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
