import { Body, Controller, Post, UseGuards, Headers, NotFoundException, Param, Put, Delete, Get, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CreateMealDto, Meal, JwtRoleGuard, ControllerContract, ControllerExceptionFilter, ProxyMessengerFilter, proxyPattern, ProxyMessage } from '@backend-evolved/shared';
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
        @Payload() payload: typeof proxyPattern.diet.meal.getOne.send
    ): Promise<ProxyMessage<typeof proxyPattern.diet.meal.getOne.receive>> {
        const foundMeal = await this.mealService.findOneWhere({ id: payload.mealId });
        if (foundMeal.diet.patientId !== payload.patientId) {
            throw new NotFoundException('Meal not found for the given patient and nutritionist');
        }
        
        return { payload: foundMeal };
    }


}
