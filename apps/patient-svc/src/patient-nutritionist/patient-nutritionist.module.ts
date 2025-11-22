import { Module } from '@nestjs/common';
import { PatientNutritionistService } from './patient-nutritionist.service';
import { PatientNutritionistController } from './patient-nutritionist.controller';
import { dbConnection } from '../database/db-connection';
import { NUTRITIONIST_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [PatientNutritionistController],
    providers: [
        PatientNutritionistService,
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME)
    ],
})
export class PatientNutritionistModule { }
