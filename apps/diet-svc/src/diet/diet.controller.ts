import { Headers, Body, Controller, Get, Post, UseGuards, ForbiddenException, Param, NotFoundException, Put, Delete, UseFilters, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { DietService } from './diet.service';
import { Aliment, ALIMENT_SERVICE_PROXY_NAME, ControllerExceptionFilter, CreateDietDto, Diet, Food, JwtRoleGuard, UpdateDietDto } from '@backend-evolved/shared';
import { FoodService } from '../food/food.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('diet')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class DietController {
	constructor(
		private readonly dietService: DietService,
		private readonly foodService: FoodService,
		@Inject(ALIMENT_SERVICE_PROXY_NAME) private readonly alimentServiceProxy: ClientProxy
	) { }

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
	@UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
	@UseFilters(ControllerExceptionFilter)
	async findAll(
		@Headers() headers: any,
		@Body('patientId') patientId: string,
		@Body('nutritionistId') nutritionistId: string
	): Promise<any[]> {
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
	@UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
	@UseFilters(ControllerExceptionFilter)
	async findById(
		@Param('dietId') dietId: string,
		@Headers() headers: any
	): Promise<Diet> {
		const diet = await this.dietService.findOne({ id: dietId });
		if (!diet) {
			throw new NotFoundException("Diet not found");
		}
		const isRelated = diet.nutritionistId === headers['user-id'] || diet.patientId === headers['user-id'];
		if (!isRelated) {
			throw new ForbiddenException("User not allowed to access this diet");
		}
		return await this.fetchDietAliments(diet);
	}

	private async fetchDietAliments(diet: Diet): Promise<any> {
		const allAlimentIds: string[] = []
		const foodPositions: { mealIndex: number, foodIndex: number, alimentId: string }[] = []

		diet.meals?.forEach((meal, mealIndex) => {
			meal.foods?.forEach((food: Food, foodIndex: number) => {
				if (food.alimentId) {
					allAlimentIds.push(food.alimentId)
					foodPositions.push({ mealIndex, foodIndex, alimentId: food.alimentId })
				}
			})
		})

		let fetchedAliments: Aliment[] = []
		if (allAlimentIds.length > 0) {
			fetchedAliments = await firstValueFrom(
				this.alimentServiceProxy.send<Aliment[]>('findManyAlimentsByIds', { ids: allAlimentIds, source: null })
			)
		}

		const alimentMap = new Map(fetchedAliments.map(a => [a._id.toString(), a]))

		foodPositions.forEach(pos => {
			const aliment = alimentMap.get(pos.alimentId)
			const food = diet.meals![pos.mealIndex].foods![pos.foodIndex]
			const { alimentId, ...rest } = food
			diet.meals![pos.mealIndex].foods![pos.foodIndex] = { ...rest, aliment: aliment || null } as any
		})

		return diet
	}


	@Post()
	@ApiOperation({
		summary: 'Create a new diet',
		description: 'Create a new diet for a given patient'
	})
	@ApiCreatedResponse({
		description: 'The diet has been successfully created.',
		type: CreateDietDto
	})
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async createDiet(
		@Body() createDietDto: CreateDietDto,
		@Headers() headers: any
	): Promise<Diet> {
		if (!createDietDto.startDate) createDietDto.startDate = new Date();
		return await this.dietService.createOne({ ...createDietDto, nutritionistId: headers['user-id'] });
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
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async updateDiet(
		@Param('dietId') dietId: string,
		@Body() updateDietDto: UpdateDietDto,
		@Headers() headers: any
	): Promise<Diet> {
		return await this.dietService.updateOne({ id: dietId }, updateDietDto);
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
	@UseGuards(JwtRoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async deleteDiet(
		@Param('dietId') dietId: string,
		@Headers() headers: any
	): Promise<void> {
		return await this.dietService.deleteOne({ id: dietId });
	}

}