import { Post, Body, Controller, Headers, NotFoundException, Get, Param, Put, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { FoodService } from './food.service';
import { CreateFoodDto, Food, RoleGuard } from '@backend-evolved/shared';
import { MealService } from '../meal/meal.service';
import { ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiNotFoundResponse, ApiNoContentResponse, ApiForbiddenResponse } from '@nestjs/swagger';

@Controller('diet/:dietId/meal/:mealId/food')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class FoodController {
    constructor(
        private readonly foodService: FoodService,
        private readonly mealService: MealService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new food', description: 'Create a new food for a given meal' })
    @ApiCreatedResponse({ description: 'The food has been successfully created.', type: Food })
    @ApiNotFoundResponse({ description: 'Meal not found or user does not have access to this meal.' })
    @UseGuards(RoleGuard(['nutritionist']))
    async postOne(@Param('dietId') dietId: string, @Param('mealId') mealId: string, @Body() createFoodDto: CreateFoodDto, @Headers() headers: any) {
        const usedMealId = mealId || createFoodDto.mealId;
        const meal = await this.mealService.findById(usedMealId);
        if (!meal) {
            throw new NotFoundException('Meal not found');
        }
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
        const { quantity, unitOfMeasure } = createFoodDto;
        const payload: any = { quantity, unitOfMeasure, meal: { id: usedMealId } };
        return await this.foodService.create(payload);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve foods for a meal', description: 'Retrieve all foods for a given meal' })
    @ApiOkResponse({ description: 'The foods have been successfully retrieved.', type: [Food] })
    @ApiForbiddenResponse({ description: 'User not allowed to access these foods' })
    @UseGuards(RoleGuard(['nutritionist', 'patient']))
    async getAll(@Param('dietId') dietId: string, @Param('mealId') mealId: string, @Headers() headers: any) {
        const meal = await this.mealService.findById(mealId);
        if (!meal) throw new NotFoundException('Meal not found');
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new ForbiddenException('User not allowed to access these foods');
        return await this.foodService.findAll({ meal: { id: mealId } });
    }

    @Get(':foodId')
    @ApiOperation({ summary: 'Get a specific food by ID', description: 'Retrieve details of a specific food using its ID' })
    @ApiOkResponse({ description: 'The food has been successfully retrieved.', type: Food })
    @ApiNotFoundResponse({ description: 'Food not found or user does not have access to this food.' })
    @UseGuards(RoleGuard(['nutritionist', 'patient']))
    async getOneById(@Param('mealId') mealId: string, @Param('foodId') foodId: string, @Headers() headers: any) {
        const food = await this.foodService.findById(foodId);
        if (!food) throw new NotFoundException('Food not found');
        const meal = await this.mealService.findById(mealId);
        if (!meal) throw new NotFoundException('Meal not found');
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new ForbiddenException('User not allowed to access this food');
        return food;
    }

    @Put(':foodId')
    @ApiOperation({ summary: 'Update a specific food', description: 'Update the details of a specific food' })
    @ApiOkResponse({ description: 'The food has been successfully updated.', type: Food })
    @ApiNotFoundResponse({ description: 'Food not found or user does not have access to this food.' })
    @UseGuards(RoleGuard(['nutritionist']))
    async updateOneById(@Param('mealId') mealId: string, @Param('foodId') foodId: string, @Body() update: Partial<CreateFoodDto>, @Headers() headers: any) {
        const meal = await this.mealService.findById(mealId);
        if (!meal) throw new NotFoundException('Meal not found');
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
        const payload: any = { ...update };
        if ((payload as any).mealId) {
            payload.meal = { id: (payload as any).mealId };
            delete payload.mealId;
        }
        return await this.foodService.update(foodId, payload as any);
    }

    @Delete(':foodId')
    @ApiOperation({ summary: 'Delete a specific food by ID', description: 'Remove a specific food from the meal' })
    @ApiNoContentResponse({ description: 'The food has been successfully deleted.' })
    @ApiNotFoundResponse({ description: 'Food not found or user does not have access to this food.' })
    @UseGuards(RoleGuard(['nutritionist']))
    async deleteOneById(@Param('mealId') mealId: string, @Param('foodId') foodId: string, @Headers() headers: any) {
        const meal = await this.mealService.findById(mealId);
        if (!meal) throw new NotFoundException('Meal not found');
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
        return await this.foodService.delete(foodId);
    }

}
