import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientRestController } from './patient-rest.controller';
import { provideProxyService, AUTH_SERVICE_PROXY_NAME, NUTRITIONIST_SERVICE_PROXY_NAME } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';
import { PatientProxyController } from './patient-proxy.controller';
import { WaterGoalService } from '../water-goal/water-goal.service';
import { 
    PatientNutritionistRestController
} from './nutritionist-controller/patient-nutritionist-rest.controller';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        PatientRestController,
        PatientNutritionistRestController,
        PatientProxyController
    ],
    providers: [
        PatientService,
        WaterGoalService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
