import { Module } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietController } from './diet.controller';
import { dbConnection } from '../database/provide-db';
import { MealService } from '../meal/meal.service';
import { ALIMENT_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { FoodService } from '../food/food.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [DietController],
    providers: [
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        provideProxyService(ALIMENT_SERVICE_PROXY_NAME),
        DietService,
        MealService,
        FoodService,
    ],
    exports: [DietService, MealService],
})
export class DietModule { }
