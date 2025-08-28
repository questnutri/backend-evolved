import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { provideProxyService, AUTH_SERVICE_PROXY_NAME } from '@backend-evolved/shared';
import { PatientNutritionistService } from './patient-nutritionist.service';
import { dbConnection } from '../database/provide-db';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [PatientController],
    providers: [
        PatientService,
        PatientNutritionistService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
