import { Headers, Body, Controller, Get, Post, UseGuards, ForbiddenException, Param, NotFoundException, Put, Delete, UseFilters, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { DietService } from './diet.service';
import { ControllerExceptionFilter, CreateDietDto, Diet, JwtRoleGuard, UpdateDietDto, DietPlan } from '@backend-evolved/shared';
import { FoodService } from '../food/food.service';

@Controller('diet')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class DietController {
	constructor(
		private readonly dietService: DietService,
		private readonly foodService: FoodService
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

	@Get('/plan')
	@ApiOperation({
		summary: 'Get complex diet plan for a patient',
		description: 'Retrieve a comprehensive diet plan with calendar planning for a specific patient, including meal schedules and records'
	})
	@ApiQuery({ 
		name: 'length', 
		description: 'Number of months to include (default: 1 = current month + 1 back + 1 forward)', 
		required: false, 
		type: Number 
	})
	@ApiQuery({ 
		name: 'patientId', 
		description: 'Patient ID (required for nutritionist, optional for patient)', 
		required: false, 
		type: String 
	})
	@ApiOkResponse({
		description: 'Diet plan has been successfully generated.',
		type: [DietPlan]
	})
	@ApiForbiddenResponse({
		description: 'User not allowed to access this diet plan',
	})
	@UseGuards(JwtRoleGuard(['nutritionist', 'patient']))
	@UseFilters(ControllerExceptionFilter)
	async getDietPlan(
		@Headers() headers: any,
		@Query('length') length?: number,
		@Query('patientId') queryPatientId?: string
	): Promise<DietPlan[]> {
		const userId = headers['user-id'];
		const userRole = headers['role'];
		
		// Determine patient ID based on user role
		let patientId: string;
		if (userRole === 'patient') {
			patientId = userId;
		} else if (userRole === 'nutritionist') {
			if (!queryPatientId) {
				throw new ForbiddenException('Nutritionist must specify a patientId to get diet plan');
			}
			patientId = queryPatientId;
		} else {
			throw new ForbiddenException('Invalid user role for diet plan access');
		}

		const planLength = length && length > 0 ? length : 1;
		return await this.dietService.getDietPlanForPatient(patientId, planLength);
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
		return await this.dietService.fetchDietAlimentsPublic(diet);
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