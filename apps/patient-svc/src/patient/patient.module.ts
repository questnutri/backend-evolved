import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { provideProxyService, AUTH_SERVICE_PROXY_NAME } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [PatientController],
    providers: [
        PatientService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
