import { Body, Controller, Post, UseGuards, Headers, NotFoundException, Param, Put, Delete, Get, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MealService } from './meal.service';
import { ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CreateMealDto, Meal, JwtRoleGuard, ControllerContract, ControllerExceptionFilter, ProxyMessengerFilter, ContextUser } from '@backend-evolved/shared';
import { FoodService } from '../food/food.service';
import { DietService } from '../diet/diet.service';

@Controller(':dietId/meal')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class MealController implements ControllerContract<Meal> {
	constructor(
		private readonly mealService: MealService,
		private readonly dietService: DietService,
		private readonly foodService: FoodService,
	) { }

	// @Get()
	// async getMealsByDietId(@Param('dietId') dietId: string) {
	// 	return await this.mealService.findAll({ diet: { id: dietId } });
	// }


	@Post()
	@ApiOperation({
		summary: 'Create a new meal',
		description: `Create a new meal for a given diet with various repeat configuration options.
		
**Repeat Configuration Types:**
- **ONCE**: Meal occurs only once on a specific date
- **DAILY**: Meal repeats every day or every X days
- **WEEKLY**: Meal repeats on specific days of the week
- **WEEKDAYS**: Meal repeats only on weekdays (Monday-Friday)
- **MONTHLY**: Meal repeats on the same day of the month as the start date
- **MONTHLY_DATE**: Meal repeats on a specific day of each month

**Note on Date Validation:** 
When creating meal records, the system validates that the \`mealRelativeDate\` matches the meal's repeat configuration and falls within the diet's date range.`
	})
	@ApiCreatedResponse({
		description: 'The meal has been successfully created.',
		type: CreateMealDto,
		examples: {
			// ONCE type - for special occasions or one-time meals
			onceType: {
				summary: 'ONCE - Special Birthday Meal (occurs only once on a specific date)',
				value: {
					name: 'Birthday Special Dinner',
					description: 'Special birthday celebration meal with cake and favorite foods',
					hour: '19:00',
					repeatConfiguration: {
						type: 'ONCE',
						startDate: '2025-09-25'
					}
				}
			},
			// DAILY type - standard daily meals
			dailyType: {
				summary: 'DAILY - Regular Breakfast (repeats every day)',
				value: {
					name: 'Daily Breakfast',
					description: 'Healthy breakfast to start each day',
					hour: '08:00',
					repeatConfiguration: {
						type: 'DAILY',
						interval: 1
					}
				}
			},
			// DAILY with interval - every few days
			dailyInterval: {
				summary: 'DAILY - Every 3 Days Protein Boost (repeats every 3 days)',
				value: {
					name: 'Protein Boost Meal',
					description: 'High-protein meal for muscle building, every 3 days',
					hour: '15:00',
					repeatConfiguration: {
						type: 'DAILY',
						interval: 3
					}
				}
			},
			// WEEKLY type - specific days of the week
			weeklyType: {
				summary: 'WEEKLY - Monday, Wednesday, Friday Workout Meal (0=Sunday, 1=Monday, etc.)',
				value: {
					name: 'Pre-Workout Meal',
					description: 'Energy-rich meal before workout sessions',
					hour: '17:00',
					repeatConfiguration: {
						type: 'WEEKLY',
						interval: 1,
						daysOfWeek: [1, 3, 5] // Monday, Wednesday, Friday
					}
				}
			},
			// WEEKLY weekend meals
			weeklyWeekend: {
				summary: 'WEEKLY - Weekend Brunch (Saturday and Sunday only)',
				value: {
					name: 'Weekend Brunch',
					description: 'Relaxed brunch meal for Saturday and Sunday',
					hour: '10:30',
					repeatConfiguration: {
						type: 'WEEKLY',
						interval: 1,
						daysOfWeek: [0, 6] // Sunday, Saturday
					}
				}
			},
			// WEEKDAYS type - Monday to Friday only
			weekdaysType: {
				summary: 'WEEKDAYS - Office Lunch (Monday-Friday only)',
				value: {
					name: 'Office Lunch',
					description: 'Work day lunch meal with balanced nutrition',
					hour: '12:30',
					repeatConfiguration: {
						type: 'WEEKDAYS'
					}
				}
			},
			// MONTHLY type - same day of month as start date
			monthlyType: {
				summary: 'MONTHLY - Monthly Health Check (repeats on same day of month as startDate)',
				value: {
					name: 'Monthly Health Check Meal',
					description: 'Special nutritious meal on the same day each month as the start date (15th)',
					hour: '14:00',
					repeatConfiguration: {
						type: 'MONTHLY',
						startDate: '2025-09-15'
					}
				}
			},
			// MONTHLY_DATE type - specific day of each month
			monthlyDateType: {
				summary: 'MONTHLY_DATE - 30th of Each Month (specific dayOfMonth)',
				value: {
					name: 'End-of-Month Review',
					description: 'Special meal on the 30th of every month',
					hour: '18:00',
					repeatConfiguration: {
						type: 'MONTHLY_DATE',
						dayOfMonth: 30
					}
				}
			},
			// Simple meal without repeat configuration (defaults to ONCE)
			simpleType: {
				summary: 'Simple Meal (No Repeat Configuration - defaults to ONCE type)',
				value: {
					name: 'Simple Snack',
					description: 'A simple snack without specific scheduling',
					hour: '16:00'
				}
			},
			// Complex WEEKLY with interval - every 2 weeks
			weeklyBiweekly: {
				summary: 'WEEKLY - Bi-weekly Cheat Meal (every 2 weeks on Sunday)',
				value: {
					name: 'Bi-weekly Cheat Meal',
					description: 'Allowed cheat meal every two weeks',
					hour: '13:00',
					repeatConfiguration: {
						type: 'WEEKLY',
						interval: 2,
						daysOfWeek: [0] // Sunday only, every 2 weeks
					}
				}
			}
		}
	})
	@ApiNotFoundResponse({ description: 'Diet not found or user does not have access to this diet.' })
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async postOne(
		@Param('dietId') dietId: string,
		@Body() createMealDto: CreateMealDto,
		@Headers() headers: any,
		@ContextUser() ctxUser: ContextUser
	) {
		const diet = await this.dietService.findOneWhere({ id: dietId });
		if (!diet) throw new NotFoundException('Diet not found');
		const isRelated = diet.nutritionistId === headers['user-id'] || diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
		return await this.mealService.createOne({ ...createMealDto, diet });
	}

	/**
	 * Create a meal and multiple foods in a single request.
	 * Body may include an optional `foods` array with food payloads.
	 */
	@Post('full')
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async postOneFull(
		@Param('dietId') dietId: string,
		@Body() createMealDto: any,
		@Headers() headers: any
	) {
		const diet = await this.dietService.findOneWhere({ id: dietId });
		if (!diet) throw new NotFoundException('Diet not found');
		const isRelated = diet.nutritionistId === headers['user-id'] || diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);

		// Create the meal first
		const createdMeal = await this.mealService.createOne({ ...createMealDto, diet });

		const createdFoods: any[] = [];
		if (createMealDto.foods && Array.isArray(createMealDto.foods)) {
			for (const f of createMealDto.foods) {
				const payload: any = { ...f, meal: createdMeal };
				const created = await this.foodService.createOne(payload as any);
				createdFoods.push(created);
			}
		}

		// Attach foods (with aliment loaded) to response
		const foodsWithAliment = await this.foodService.findAll({ meal: { id: createdMeal.id } });
		// return meal with foods array
		return { ...createdMeal, foods: foodsWithAliment };
	}

	@Get(':mealId')
	@ApiOperation({
		summary: 'Get a specific meal by ID',
		description: 'Retrieve details of a specific meal using its ID'
	})
	@ApiOkResponse({ description: 'The meal has been successfully retrieved.', type: Meal })
	@ApiNotFoundResponse({ description: 'Meal not found or user does not have access to this meal.' })
	@UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
	async getOneById(@Headers() headers: any, @Param('mealId') mealId: string) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new NotFoundException('Meal not found');
		console.log(meal);
		const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
		return meal;

	}

	@Put(':mealId')
	@ApiOperation({
		summary: 'Update a specific meal',
		description: 'Update the details of a specific meal'
	})
	@ApiOkResponse({ description: 'The meal has been successfully updated.', type: Meal })
	@ApiNotFoundResponse({ description: 'Meal not found or user does not have access to this meal.' })
	@UseGuards(JwtRoleGuard(['nutritionist']))
	async updateOneById(@Param('mealId') mealId: string, @Body() updateMealDto: Partial<CreateMealDto>, @Headers() headers: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new NotFoundException('Meal not found');
		const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
		return await this.mealService.update(mealId, updateMealDto);
	}

	@Delete(':mealId')
	@ApiOperation({
		summary: 'Delete a specific meal by ID',
		description: 'Remove a specific meal from the diet'
	})
	@ApiNoContentResponse({
		description: 'The meal has been successfully deleted.'
	})
	@ApiNotFoundResponse({ description: 'Meal not found or user does not have access to this meal.' })
	@UseGuards(JwtRoleGuard(['nutritionist']))
	async deleteOneById(@Param('mealId') mealId: string, @Headers() headers: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new NotFoundException('Meal not found');
		const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
		return await this.mealService.delete(mealId);
	}

	@MessagePattern('meal.getInfo')
	@UseFilters(ProxyMessengerFilter)
	async getMealInfo(@Payload() data: { mealId: string, patientId?: string }) {
		const mealInfo = await this.mealService.getMealInfo(data.mealId, data.patientId);
		return { payload: mealInfo };
	}

	@MessagePattern('meal.getDetailedInfo')
	@UseFilters(ProxyMessengerFilter)
	async getMealDetailedInfo(@Payload() data: { mealId: string, patientId?: string }) {
		const mealDetailedInfo = await this.mealService.getMealDetailedInfo(data.mealId, data.patientId);
		return { payload: mealDetailedInfo };
	}

}
