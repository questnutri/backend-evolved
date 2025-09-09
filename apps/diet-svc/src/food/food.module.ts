import { Module } from '@nestjs/common';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { MealService } from '../meal/meal.service';
import { dbConnection } from '../database/provide-db';
import { ALIMENT_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [FoodController],
    providers: [
        FoodService,
        MealService,
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        provideProxyService(ALIMENT_SERVICE_PROXY_NAME)
    ],
    exports: [FoodService, MealService],
})
export class FoodModule { }
