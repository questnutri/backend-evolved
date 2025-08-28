import { Module } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietController } from './diet.controller';
import { dbConnection } from '../database/provide-db';
import { MealService } from '../meal/meal.service';
import { PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [DietController],
    providers: [
        DietService,
        MealService,
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
    exports: [DietService, MealService],
})
export class DietModule { }
