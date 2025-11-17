import { Module } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import { NutritionistRestController } from './nutritionist-rest.controller';
import { AUTH_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';
import { NutritionistProxyController } from './nutritionist-proxy.controller';
import { PatientRestController } from './patients/patients-rest.controller';


@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        NutritionistRestController,
        NutritionistProxyController,
        PatientRestController,
    ],
    providers: [
        NutritionistService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
})
export class NutritionistModule { }
