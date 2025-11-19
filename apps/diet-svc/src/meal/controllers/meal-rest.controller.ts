import {
	Body,
	Controller,
	Post,
	UseGuards,
	Headers,
	NotFoundException,
	Param,
	Put,
	Delete,
	Get,
	UseFilters
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MealService } from '../meal.service';
import {
	ApiBearerAuth,
	ApiSecurity,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiBody
} from '@nestjs/swagger';
import {
	CreateMealDto,
	Meal,
	JwtRoleGuard, ControllerExceptionFilter,
	ProxyMessengerFilter,
	ContextUser,
	CreateFoodDto
} from '@backend-evolved/shared';

import { FoodService } from '../../food/food.service';
import { DietService } from '../../diet/diet.service';

@Controller('meals')
@ApiTags('Meals')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class MealRestController {
	constructor(
		private readonly mealService: MealService,
		private readonly dietService: DietService,
		private readonly foodService: FoodService,
	) { }

	@Post()
	@ApiOperation({
		summary: 'Create a new meal',
		description: `Create a new meal for a given diet with various repeat configuration options.
		
**Repeat Configuration Types:**
- **ONCE**: Meal occurs only once on a specific date
- **DAILY**: Meal repeats every day or every X days
- **WEEKLY**: Meal repeats on specific days of the week
- **MONTHLY**: Meal repeats on specific days of the month

**Note on Date Validation:** 
When creating meal records, the system validates that the \`mealRelativeDate\` matches the meal's repeat configuration and falls within the diet's date range.`
	})
	@ApiBody({
		description: 'CreateMealDto payload. Examples show repeatConfiguration for each RepeatType.',
		required: true,
		examples: {
			once: {
				summary: 'Once on a specific date',
				value: {
					name: 'Birthday Dinner',
					description: 'Special one-time meal',
					hour: '19:00',
					dietId: 'diet-uuid-1111',
					repeatConfiguration: {
						type: 'ONCE',
						targetDate: '2025-09-25'
					}
				}
			},
			daily_every_day: {
				summary: 'Repeat daily - every day',
				value: {
					name: 'Daily Breakfast',
					hour: '08:00',
					dietId: 'diet-uuid-2222',
					repeatConfiguration: {
						type: 'DAILY',
						repeatTarget: 1
					}
				}
			},
			daily_interval: {
				summary: 'Repeat daily - every 3 days',
				value: {
					name: 'Protein Boost Meal',
					hour: '15:00',
					dietId: 'diet-uuid-3333',
					repeatConfiguration: {
						type: 'DAILY',
						repeatTarget: 3
					}
				}
			},
			weekly: {
				summary: 'Repeat weekly - specific weekdays (1=Monday, 3=Wednesday, 5=Friday)',
				value: {
					name: 'Pre-Workout Meal',
					hour: '17:00',
					dietId: 'diet-uuid-4444',
					repeatConfiguration: {
						type: 'WEEKLY',
						repeatTarget: 1,
						daysOfWeek: [1, 3, 5]
					}
				}
			},
			monthly: {
				summary: 'Repeat monthly - repeat on specific days of the month',
				value: {
					name: 'End-of-Month Review Meal',
					hour: '18:00',
					dietId: 'diet-uuid-6666',
					repeatConfiguration: {
						type: 'MONTHLY',
						daysOfMonth: [1, 15, 30]
					}
				}
			},
			simple_no_repeat: {
				summary: 'No repeatConfiguration (treated as ONCE on meal startDate)',
				value: {
					name: 'Simple Snack',
					hour: '16:00',
					dietId: 'diet-uuid-7777',
					startDate: '2025-09-20'
				}
			}
		}
	})
	@ApiCreatedResponse({
		description: 'The meal has been successfully created.',
		type: Meal,
		examples: {
			onceType: {
				summary: 'ONCE - One-time meal on a specific date',
				value: {
					id: 'meal-uuid-1111',
					name: 'Birthday Special Dinner',
					description: 'Special birthday celebration meal',
					hour: '19:00',
					dietId: 'diet-uuid-1111',
					repeatConfiguration: {
						type: 'ONCE',
						targetDate: '2025-09-25'
					},
					foods: []
				}
			},
			dailyType: {
				summary: 'DAILY - Every day',
				value: {
					id: 'meal-uuid-2222',
					name: 'Daily Breakfast',
					hour: '08:00',
					dietId: 'diet-uuid-2222',
					repeatConfiguration: {
						type: 'DAILY',
						repeatTarget: 1
					},
					foods: []
				}
			},
			dailyInterval: {
				summary: 'DAILY - Every 3 days',
				value: {
					id: 'meal-uuid-3333',
					name: 'Protein Boost Meal',
					hour: '15:00',
					dietId: 'diet-uuid-3333',
					repeatConfiguration: {
						type: 'DAILY',
						repeatTarget: 3
					},
					foods: []
				}
			},
			weeklyType: {
				summary: 'WEEKLY - Specific weekdays (1=Monday, 3=Wednesday, 5=Friday)',
				value: {
					"id": "meal-uuid-4444",
					"name": "Pre-Workout Meal",
					"repeatConfiguration": {
						"type": "WEEKLY",
						"daysOfWeek": [
							1,
							3,
							5
						],
						"repeatTarget": 1
					},
					"hour": "17:00",
					"startDate": "2025-11-19T03:00:00.000Z",
					"endDate": null,
					"createdAt": "2025-11-19T06:59:16.126Z",
					"updatedAt": "2025-11-19T06:59:16.126Z",
					"diet": {
						"id": "diet-uuid-4444",
						"name": "Muscle Gain Plan",
						"description": "A diet plan focused on muscle gain.",
						"patientId": "patient-uuid-4444",
						"nutritionistId": "nutritionist-uuid-4444",
						"timeZone": -3,
						"createdAt": "2025-11-19T06:45:52.767Z",
						"updatedAt": "2025-11-19T06:45:52.767Z",
						"startDate": "2025-11-19T03:00:00.000Z",
						"endDate": null
					}
				}
			},
			weeklyWeekend: {
				summary: 'WEEKLY - Weekend meals (Saturday & Sunday)',
				value: {
					id: 'meal-uuid-5555',
					name: 'Weekend Brunch',
					hour: '10:30',
					dietId: 'diet-uuid-5555',
					repeatConfiguration: {
						type: 'WEEKLY',
						repeatTarget: 1,
						daysOfWeek: [6, 0]
					},
					foods: []
				}
			},
			monthlyType: {
				summary: 'MONTHLY - Repeat on specific days of month',
				value: {
					id: 'meal-uuid-6666',
					name: 'End-of-Month Review Meal',
					hour: '18:00',
					dietId: 'diet-uuid-6666',
					repeatConfiguration: {
						type: 'MONTHLY',
						daysOfMonth: [30]
					},
					foods: []
				}
			},
			simpleType: {
				summary: 'Simple Meal (no repeatConfiguration provided - treated as ONCE)',
				value: {
					id: 'meal-uuid-7777',
					name: 'Simple Snack',
					hour: '16:00',
					dietId: 'diet-uuid-7777',
					foods: []
				}
			}
		}
	})
	@ApiNotFoundResponse({ description: 'Diet not found or user does not have access to this diet.' })
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async postOne(
		@Body() createMealDto: CreateMealDto,
		@ContextUser() ctxUser: ContextUser
	) {
		const diet = await this.dietService.findOneWhere({ id: createMealDto.dietId, nutritionistId: ctxUser.id });
		return await this.mealService.createOne({ ...createMealDto, diet });
	}

	/**
	 * Create a meal and multiple foods in a single request.
	 * Body may include an optional `foods` array with food payloads.
	 */
	@Post('full')
	@ApiOperation({})
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async postOneFull(
		@Body() body: CreateMealDto & { foods?: CreateFoodDto[] },
		@ContextUser() ctxUser: ContextUser,
	) {
		const diet = await this.dietService.findOneWhere({ id: body.dietId });
		const isRelated = diet.nutritionistId === ctxUser.id;
		if (!isRelated) throw new NotFoundException('Diet not found or not related to user');

		// Create the meal first
		const createdMeal = await this.mealService.createOne({ ...body, diet });

		const createdFoods: any[] = [];
		if (body.foods && Array.isArray(body.foods)) {
			for (const f of body.foods) {
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
