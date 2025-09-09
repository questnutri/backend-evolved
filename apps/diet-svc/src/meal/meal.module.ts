import { Module } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { dbConnection } from '../database/provide-db';
import { DietService } from '../diet/diet.service';
import { FoodService } from '../food/food.service';
import { ALIMENT_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
	imports: [
		dbConnection()
	],
	controllers: [MealController],
	providers: [
		MealService,
		DietService,
		FoodService,
		provideProxyService(PATIENT_SERVICE_PROXY_NAME),
		provideProxyService(ALIMENT_SERVICE_PROXY_NAME)

	],
	exports: [MealService, DietService, FoodService],
})
export class MealModule { }
