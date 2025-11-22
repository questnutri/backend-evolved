import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientRestController } from './controllers/patient-rest.controller';
import { provideProxyService, AUTH_SERVICE_PROXY_NAME, NUTRITIONIST_SERVICE_PROXY_NAME, DIET_SERVICE_PROXY_NAME } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';
import { PatientProxyController } from './controllers/patient-proxy.controller';
import { WaterGoalService } from '../water-goal/water-goal.service';
import { 
    PatientNutritionistRestController
} from './controllers/nutritionist-controller/patient-nutritionist-rest.controller';
import { PatientNutritionistService } from '../patient-nutritionist/patient-nutritionist.service';

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
        PatientNutritionistService,
        WaterGoalService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME),
        provideProxyService(DIET_SERVICE_PROXY_NAME)
    ],
})
export class PatientModule { }
