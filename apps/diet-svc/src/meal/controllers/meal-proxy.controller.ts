import { Controller, NotFoundException, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ProxyMessengerFilter, proxyPattern, ProxyMessage } from '@backend-evolved/shared';
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
    async getOne(
        @Payload() payload: typeof proxyPattern.diet.meal.getOne.payload
    ): Promise<ProxyMessage<typeof proxyPattern.diet.meal.getOne.receive>> {
        return { payload: await this.mealService.findOneWhere({ id: payload.mealId }) };
    }


}
