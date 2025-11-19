import { Module, forwardRef } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealRestController } from './controllers/meal-rest.controller';
import { dbConnection } from '../database/db-connection';
import { DietModule } from '../diet/diet.module';
import { FoodService } from '../food/food.service';
import { ALIMENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { MealProxyController } from './controllers/meal-proxy.controller';

@Module({
	imports: [
		dbConnection(),
		forwardRef(() => DietModule)
	],
	controllers: [
		MealRestController,
		MealProxyController
	],
	providers: [
		MealService,
		FoodService,
		provideProxyService(ALIMENT_SERVICE_PROXY_NAME)
	],
	exports: [MealService, FoodService],
})
export class MealModule { }
