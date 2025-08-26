import { Body, Controller, Post, UseGuards, Headers, NotFoundException, Param, Put, Delete, Get } from '@nestjs/common';
import { MealService } from './meal.service';
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CreateMealDto, Meal, RoleGuard, ControllerContract} from '@backend-evolved/shared';
import { DietService } from '../diet/diet.service';

@Controller('meal')
export class MealController implements ControllerContract<Meal> {
	constructor(
		private readonly mealService: MealService,
		private readonly dietService: DietService
	) { }
	// postOne(item: Meal): Promise<Meal> {
	// 	throw new Error('Method not implemented.');
	// }
	// getAll(query: { id?: any; name?: any; diet?: any; foods?: any; daysOfWeek?: any; hour?: any; createdAt?: any; updatedAt?: any; isPatientRelated?: any; isNutritionistRelated?: any; }): Promise<Meal[]> {
	// 	throw new Error('Method not implemented.');
	// }
	// getOneById(id: string): Promise<Meal | null> {
	// 	throw new Error('Method not implemented.');
	// }
	// updateOneById(id: string, item: Partial<Meal>): Promise<Meal | null> {
	// 	throw new Error('Method not implemented.');
	// }
	// deleteOneById(id: string): Promise<void> {
	// 	throw new Error('Method not implemented.');
	// }

	@Post()
	@ApiOperation({
		summary: 'Create a new meal',
		description: 'Create a new meal for a given patient'
	})
	@ApiCreatedResponse({
		description: 'The meal has been successfully created.',
		type: CreateMealDto
	})
	@ApiNotFoundResponse({ description: 'Diet not found or user does not have access to this diet.' })
	@UseGuards(RoleGuard(['nutritionist']))
	async postOne(
		@Body() createMealDto: CreateMealDto,
		@Headers() headers: any
	) {
		const diet = await this.dietService.findById(createMealDto.dietId);
		if (!diet) throw new NotFoundException('Diet not found');
		const isRelated = diet.nutritionistId === headers['user-id'] || diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
		return await this.mealService.create(createMealDto);
	}

	@Get(':mealId')
	@ApiOperation({
		summary: 'Get a specific meal by ID',
		description: 'Retrieve details of a specific meal using its ID'
	})
	@ApiOkResponse({ description: 'The meal has been successfully retrieved.', type: Meal })
	@ApiNotFoundResponse({ description: 'Meal not found or user does not have access to this meal.' })
	@UseGuards(RoleGuard(['nutritionist', 'patient']))
	async getOneById(@Headers() headers: any, @Param('mealId') mealId: string) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new NotFoundException('Meal not found');
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
	@UseGuards(RoleGuard(['nutritionist']))
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
	@UseGuards(RoleGuard(['nutritionist']))
	async deleteOneById(@Param('mealId') mealId: string, @Headers() headers: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new NotFoundException('Meal not found');
		const isRelated = meal.diet.nutritionistId === headers['user-id'] || meal.diet.patientId === headers['user-id'];
		if (!isRelated) throw new NotFoundException(`User doesn't have this diet`);
		return await this.mealService.delete(mealId);
	}

}
