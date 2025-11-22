import { Module, forwardRef } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietRestController } from './controllers/diet-rest.controller';
import { dbConnection } from '../database/db-connection';
import { MealModule } from '../meal/meal.module';
import { 
    ALIMENT_SERVICE_PROXY_NAME,
    PATIENT_SERVICE_PROXY_NAME,
    RECORD_SERVICE_PROXY_NAME,
    provideProxyService
} from '@backend-evolved/shared';
import { DietProxyController } from './controllers/diet-proxy.controller';

@Module({
    imports: [
        dbConnection(),
        forwardRef(() => MealModule)
    ],
    controllers: [
        DietRestController,
        DietProxyController
    ],
    providers: [
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        provideProxyService(ALIMENT_SERVICE_PROXY_NAME),
        provideProxyService(RECORD_SERVICE_PROXY_NAME),
        DietService,
    ],
    exports: [DietService],
})
export class DietModule { }
