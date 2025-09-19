import { Module, forwardRef } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { dbConnection } from '../database/provide-db';
import { DietModule } from '../diet/diet.module';
import { FoodService } from '../food/food.service';
import { ALIMENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
	imports: [
		dbConnection(),
		forwardRef(() => DietModule)
	],
	controllers: [MealController],
	providers: [
		MealService,
		FoodService,
		provideProxyService(ALIMENT_SERVICE_PROXY_NAME)
	],
	exports: [MealService, FoodService],
})
export class MealModule { }
