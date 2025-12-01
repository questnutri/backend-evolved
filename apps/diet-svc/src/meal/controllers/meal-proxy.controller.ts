import { Controller, NotFoundException, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import {
    ProxyMessengerFilter,
    proxyPattern,
    errorMessagePattern
} from '@backend-evolved/shared';
import { MealService } from '../meal.service';


@Controller()
export class MealProxyController {
    constructor(
        private readonly mealService: MealService,

    ) { }

    @MessagePattern(proxyPattern.diet.meal.getOne.key)
    @UseFilters(ProxyMessengerFilter)
    async getMealInfo(
        @Payload() payload: typeof proxyPattern.diet.meal.getOne.payload
    ) {
        const foundMeal = await this.mealService.findOneWhere({ id: payload.mealId });
        console.log('foundMeal', foundMeal);

        if (
            (payload.patientId && foundMeal.diet.patientId !== payload.patientId) ||
            (payload.nutritionistId && foundMeal.diet.nutritionistId !== payload.nutritionistId)
        ) {
            throw new NotFoundException(errorMessagePattern.meal.notFound.fn());
        }
        console.log(payload.dietStatus);
        if (payload.dietStatus) {
            if (foundMeal.diet.status !== payload.dietStatus) {
                throw new NotFoundException(errorMessagePattern.meal.notFound.fn());
            }
        }
        return { payload: foundMeal };
    }

    @MessagePattern('meal.getDetailedInfo') //TODO: Change to proxyPattern
    @UseFilters(ProxyMessengerFilter)
    async getMealDetailedInfo(@Payload() data: { mealId: string, patientId?: string }) {
        const mealDetailedInfo = await this.mealService.findOneWhere({ id: data.mealId, patientId: data.patientId });
        return { payload: mealDetailedInfo };
    }


}
