import { Controller, NotFoundException, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ProxyMessengerFilter, proxyPattern, ProxyMessage, errorMessagePattern } from '@backend-evolved/shared';
import { DietService } from '../../diet/diet.service';
import { FoodService } from '../../food/food.service';
import { MealService } from '../meal.service';


@Controller()
export class MealProxyController {
    constructor(
        private readonly mealService: MealService,
        private readonly dietService: DietService,
        private readonly foodService: FoodService,

    ) { }

    @MessagePattern(proxyPattern.diet.meal.getOne.key)
    @UseFilters(ProxyMessengerFilter)
    async getMealInfo(
        @Payload() payload: typeof proxyPattern.diet.meal.getOne.payload
    ) {
        const foundMeal = await this.mealService.findOneWhere({ id: payload.mealId });
        if (
            (payload.patientId && foundMeal.diet.patientId !== payload.patientId) ||
            (payload.nutritionistId && foundMeal.diet.nutritionistId !== payload.nutritionistId)
        ) {
            throw new NotFoundException(errorMessagePattern.meal.notFound);
        }
        return { payload: await this.mealService.findOneWhere({ id: payload.mealId }) };
    }

    @MessagePattern('meal.getDetailedInfo') //TODO: Change to proxyPattern
    @UseFilters(ProxyMessengerFilter)
    async getMealDetailedInfo(@Payload() data: { mealId: string, patientId?: string }) {
        const mealDetailedInfo = await this.mealService.findOneWhere({ id: data.mealId, patientId: data.patientId });
        return { payload: mealDetailedInfo };
    }


}
