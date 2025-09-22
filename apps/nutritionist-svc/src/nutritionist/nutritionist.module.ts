import { Module } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import { NutritionistController } from './nutritionist.controller';
import { AUTH_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';


@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        NutritionistController
    ],
    providers: [
        NutritionistService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
})
export class NutritionistModule { }
