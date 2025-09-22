import { Module, forwardRef } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietController } from './diet.controller';
import { dbConnection } from '../database/db-connection';
import { MealModule } from '../meal/meal.module';
import { ALIMENT_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, RECORD_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection(),
        forwardRef(() => MealModule)
    ],
    controllers: [DietController],
    providers: [
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        provideProxyService(ALIMENT_SERVICE_PROXY_NAME),
        provideProxyService(RECORD_SERVICE_PROXY_NAME),
        DietService,
    ],
    exports: [DietService],
})
export class DietModule { }
