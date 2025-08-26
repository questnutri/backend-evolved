import { Module } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietController } from './diet.controller';
import { dbConnection } from '../database/provide-db';
import { MealService } from '../meal/meal.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [DietController],
    providers: [DietService, MealService],
})
export class DietModule { }
