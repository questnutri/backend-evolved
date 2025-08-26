import { Module } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { dbConnection } from '../database/provide-db';
import { DietService } from '../diet/diet.service';
import { FoodService } from '../food/food.service';

@Module({
	imports: [
		dbConnection()
	],
	controllers: [MealController],
	providers: [MealService, DietService, FoodService],
})
export class MealModule { }
