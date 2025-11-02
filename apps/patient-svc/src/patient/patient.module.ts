import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientRestController } from './patient-rest.controller';
import { provideProxyService, AUTH_SERVICE_PROXY_NAME, NUTRITIONIST_SERVICE_PROXY_NAME } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';
import { PatientProxyController } from './patient-proxy.controller';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        PatientRestController,
        PatientProxyController
    ],
    providers: [
        PatientService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
