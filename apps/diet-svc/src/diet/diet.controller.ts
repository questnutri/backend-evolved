import { Headers, Body, Controller, Get, Post, UseGuards, ForbiddenException, Param, NotFoundException, Put, Delete } from '@nestjs/common';
import { DietService } from './diet.service';
import { CreateDietDto, Diet, Meal, Nutritionist, RoleGuard } from '@backend-evolved/shared';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { UpdateDietDto } from '../../../../libs/shared/src/dto/diet/update-diet.dto';
import { MealService } from '../meal/meal.service';

@Controller('diet')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class DietController {
	constructor(private readonly dietService: DietService,
		private readonly mealService: MealService
	) { }

	@Post()
	@ApiOperation({
		summary: 'Create a new diet',
		description: 'Create a new diet for a given patient'
	})
	@ApiCreatedResponse({
		description: 'The diet has been successfully created.',
		type: CreateDietDto
	})
	@UseGuards(RoleGuard(['nutritionist']))
	async createDiet(
		@Body() createDietDto: CreateDietDto,
		@Headers() headers: any
	) {
		return await this.dietService.create({ ...createDietDto, nutritionistId: headers['user-id'] });
	}

	@Get()
	@ApiOperation({
		summary: 'Retrieve all diets',
		description: "Retrieve all diets for a given patient"
	})
	@ApiOkResponse({
		description: 'The diets have been successfully retrieved.',
		type: [Diet]
	})
	@ApiForbiddenResponse({
		description: 'User not allowed to access these diets',
	})
	@UseGuards(RoleGuard(['nutritionist', 'patient']))
	async findAll(
		@Headers() headers: any,
		@Body('patientId') patientId: string,
		@Body('nutritionistId') nutritionistId: string
	) {
		const diets = await this.dietService.findAll({ patientId, nutritionistId });
		if (diets.length > 0) {
			const isRelated = diets[0].nutritionistId === headers['user-id'] || diets[0].patientId === headers['user-id'];
			if (isRelated) {
				return diets;
			}
			throw new ForbiddenException("User not allowed to access these diets");
		}
		return [];
	}

	@Get(':dietId')
	@ApiOperation({
		summary: 'Retrieve a specific diet by ID',
		description: 'Retrieve a specific diet by ID'
	})
	@ApiOkResponse({
		description: 'The diet has been successfully retrieved.',
		type: Diet
	})
	@ApiForbiddenResponse({
		description: 'User not allowed to access this diet',
	})
	@ApiNotFoundResponse({
		description: 'Diet not found',
	})
	@UseGuards(RoleGuard(['nutritionist', 'patient']))
	async findById(
		@Param('dietId') dietId: string,
		@Headers() headers: any
	) {
		const diet = await this.dietService.findById(dietId);
		if (!diet) {
			throw new NotFoundException("Diet not found");
		}
		const isRelated = diet.nutritionistId === headers['user-id'] || diet.patientId === headers['user-id'];
		if (!isRelated) {
			throw new ForbiddenException("User not allowed to access this diet");
		}
		return diet;
	}

	@Get(':dietId/meals')
	@ApiOperation({
		summary: 'Retrieve all meals for a specific diet',
		description: 'Retrieve all meals for a specific diet'
	})
	@ApiOkResponse({
		description: 'The meals have been successfully retrieved.',
		type: [Meal]
	})
	@ApiForbiddenResponse({
		description: 'User not allowed to access this diet',
	})
	@ApiNotFoundResponse({
		description: 'Diet not found',
	})
	@UseGuards(RoleGuard(['nutritionist', 'patient']))
	async findMealsFromDiet(
		@Param('dietId') dietId: string,
		@Headers() headers: any
	) {
		const meals = await this.mealService.findAll({ diet: { id: dietId } });
		if (!meals) {
			throw new NotFoundException("Diet not found");
		}
		const isRelated = meals[0].diet.nutritionistId === headers['user-id'] || meals[0].diet.patientId === headers['user-id'];
		if (!isRelated) {
			throw new ForbiddenException("User not allowed to access this diet");
		}
		return meals;
	}


	@Put(':dietId')
	@ApiOperation({
		summary: 'Update a specific diet by ID',
		description: 'Update a specific diet by ID'
	})
	@ApiOkResponse({
		description: 'The diet has been successfully updated.',
		type: Diet
	})
	@ApiNotFoundResponse({
		description: 'Diet not found',
	})
	@UseGuards(RoleGuard(['nutritionist']))
	async updateDiet(
		@Param('dietId') dietId: string,
		@Body() updateDietDto: UpdateDietDto,
		@Headers() headers: any
	) {
		return await this.dietService.update(dietId, updateDietDto);
	}

	@Delete(':dietId')
	@ApiOperation({
		summary: 'Delete a specific diet by ID',
		description: 'Delete a specific diet by ID'
	})
	@ApiNoContentResponse({
		description: 'The diet has been successfully deleted.',
	})
	@ApiNotFoundResponse({
		description: 'Diet not found',
	})
	@UseGuards(RoleGuard(['nutritionist']))
	async deleteDiet(
		@Param('dietId') dietId: string,
		@Headers() headers: any
	) {
		return await this.dietService.delete(dietId);
	}

}