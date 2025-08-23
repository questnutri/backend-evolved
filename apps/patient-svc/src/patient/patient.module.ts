import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { provideTypeOrmDbConnection, Patient, provideProxyService, AUTH_SERVICE_PROXY_NAME, PatientNutritionist } from '@backend-evolved/shared';

@Module({
    imports: [
        provideTypeOrmDbConnection(
            process.env.PATIENT_SERVICE_DATABASE_PORT || '5434',
            [Patient, PatientNutritionist]
        ),
    ],
    controllers: [PatientController],
    providers: [
        PatientService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
