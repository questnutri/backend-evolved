import { UseFilters, Post, Body, Controller, Headers, NotFoundException, Get, Param, Put, Delete, UseGuards, ForbiddenException, HttpCode, Query } from '@nestjs/common';
import { FoodService } from '../food.service';
import { ContextUser, ControllerExceptionFilter, CreateFoodDto, DietStatus, errorMessagePattern, Food, JwtRoleGuard, SchedulerHelper } from '@backend-evolved/shared';
import { MealService } from '../../meal/meal.service';
import { ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiNotFoundResponse, ApiNoContentResponse, ApiForbiddenResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

@Controller('foods')
@ApiTags('Foods')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class FoodController {
    constructor(
        private readonly foodService: FoodService,
        private readonly mealService: MealService
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new food',
        description: 'Create a new food for a given meal'
    })
    @ApiCreatedResponse({
        description: 'The food has been successfully created.',
        type: Food,
        example: {
            "isActive": true,
            "id": "9b4df02f-8c36-4110-b231-2306e94cd512",
            "quantity": "1",
            "portion": "100 grams",
            "description": null,
            "startDate": "2025-11-19T00:00:00.000Z",
            "endDate": null,
            "createdAt": "2025-11-19T04:46:43.429Z",
            "updatedAt": "2025-11-19T04:46:43.429Z",
            "aliment": {
                "source": "taco",
                "_id": "691d1de6632ad8acd0195557",
                "name": "Abobrinha, italiana, refogada",
                "availablePortions": [
                    "100 grams"
                ],
                "portions": {
                    "100 grams": {
                        "alimentGroup": "Verduras, hortaliças e derivados",
                        "kcal": "24,42960219",
                        "kJ": "102,2134556",
                        "carb": "4,186916667",
                        "protein": "1,06875",
                        "fat": "0,821333333",
                        "humidity": "93,49166667",
                        "dietaryFiber": "1,38",
                        "cholesterol": "NA",
                        "sodium": "2,209",
                        "calcium": "20,672",
                        "magnesium": "12,667",
                        "manganese": "0,135333333",
                        "phosphorus": "31,82833333",
                        "iron": "0,358",
                        "potassium": "193,6266667",
                        "copper": "0,022666667",
                        "zinc": "0,272",
                        "retinol": "NA",
                        "RE": "41,58333333",
                        "RAE": "20,79166667",
                        "thiamine": "0,043333333",
                        "riboflavin": "Tr",
                        "pyridoxine": "Tr",
                        "niacin": "Tr",
                        "vitaminC": "7,53",
                        "ash": "0,431333333"
                    }
                }
            }
        }
    })
    @ApiNotFoundResponse({ description: 'Meal not found or user does not have access to this meal.' })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async postOne(
        @Body() body: CreateFoodDto,
        @ContextUser() ctxUser: ContextUser
    ) {
        const meal = await this.mealService.findOneWhere({ id: body.mealId });
        const isRelated = meal.diet.nutritionistId === ctxUser.id;
        if (!isRelated) throw new NotFoundException(`Meal not found or user does not have access to this meal.`);
        return await this.foodService.createOne({ ...body, meal } as Partial<Food>, { relations: [] });
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve foods for a meal', description: 'Retrieve all foods for a given meal' })
    @ApiOkResponse({ description: 'The foods have been successfully retrieved.', type: [Food] })
    @ApiForbiddenResponse({ description: 'User not allowed to access these foods' })
    @UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
    @UseFilters(ControllerExceptionFilter)
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
    @ApiNotFoundResponse({ description: errorMessagePattern.food.notFound.key })
    @UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
    @UseFilters(ControllerExceptionFilter)
    async getOneById(@Param('mealId') mealId: string, @Param('foodId') foodId: string, @Headers() headers: any) {
        console.log("Reached here");
        const meal = await this.mealService.findOneWhere({ id: mealId });
        if (!meal) throw new NotFoundException('Meal not found');
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new ForbiddenException('User not allowed to access this food');
        const food = await this.foodService.findOneWhere({ id: foodId });
        console.log(food);
        if (!food) throw new NotFoundException('Food not found');
        return food;
    }

    @Post(':foodId/clone')
    @ApiOperation({
        summary: 'Clones a specific food',
        description: 'Create a duplicate of a specific food by its ID'
    })
    @ApiCreatedResponse({
        description: 'The food has been successfully cloned.',
        type: Food
    })
    @ApiNotFoundResponse({
        description: errorMessagePattern.food.notFound.key
    })
    @ApiQuery({
        name: 'targetMealId',
        required: false,
        type: String,
    })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async cloneOneById(
        @Param('foodId') foodId: string,
        @Query('targetMealId') targetMealId: string,
        @ContextUser() ctxUser: ContextUser,
    ) {
        const foundFood = await this.foodService.findOneWhere({ id: foodId }, ['meal', 'meal.diet']);
        if (foundFood.meal.diet.nutritionistId !== ctxUser.id) {
            throw new NotFoundException(errorMessagePattern.food.notFound.key);
        }
        const clonePayload: any = {}
        if(targetMealId) {
            const targetMeal = await this.mealService.findOneWhere({ id: targetMealId }, ['diet']);
            if(targetMeal.diet.nutritionistId !== ctxUser.id) {
                throw new NotFoundException(errorMessagePattern.meal.notFound.key);
            }
            clonePayload.meal = targetMeal;
        }
        return await this.foodService.clone(foundFood, clonePayload);
    }

    @Put(':foodId')
    @ApiOperation({ summary: 'Update a specific food', description: 'Update the details of a specific food' })
    @ApiOkResponse({ description: 'The food has been successfully updated.', type: Food })
    @ApiNotFoundResponse({ description: errorMessagePattern.food.notFound.key })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async updateOneById(@Param('mealId') mealId: string, @Param('foodId') foodId: string, @Body() update: Partial<CreateFoodDto>, @Headers() headers: any) {
        const meal = await this.mealService.findOneWhere({ id: mealId });
        if (!meal) throw new NotFoundException('Meal not found');
        const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
        if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
        const payload: any = { ...update };
        if ((payload as any).mealId) {
            payload.meal = { id: (payload as any).mealId };
            delete payload.mealId;
        }
        return await this.foodService.updateOne({ id: foodId }, payload as any);
    }

    @Delete(':foodId')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a specific food by ID', description: 'Remove a specific food from the meal' })
    @ApiNoContentResponse({ description: 'The food has been successfully deleted.' })
    @ApiNotFoundResponse({ description: errorMessagePattern.food.notFound.key })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async deleteOneById(
        @Param('foodId') foodId: string,
        @ContextUser() ctxUser: ContextUser
    ) {
        const foundFood = await this.foodService.findOneWhere({ id: foodId }, ['meal', 'meal.diet']);
        if (foundFood.meal.diet.nutritionistId !== ctxUser.id) {
            throw new NotFoundException(errorMessagePattern.food.notFound.key);
        };

        const scheduler = new SchedulerHelper(foundFood.meal.diet.timeZone);
        const requestDate = scheduler.buildDate({ startOfDay: true });
        let directDelete = false;

        if (
            foundFood.meal.diet.status === DietStatus.DEFINITION ||
            (
                foundFood.meal.diet.status === DietStatus.ACTIVE &&
                foundFood.meal.startDate! >= requestDate
            ) ||
            (
                foundFood.meal.diet.status === DietStatus.ACTIVE &&
                foundFood.startDate! >= requestDate
            )
        ) directDelete = true;

        if (directDelete) {
            return await this.foodService.delete(foundFood);
        } else {
            return await this.foodService.update(foundFood, { endDate: requestDate });
        }
    }

}
