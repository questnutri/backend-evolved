import { Headers, Body, Controller, Get, Post, UseGuards, ForbiddenException, Param, NotFoundException, Put, Delete, UseFilters } from '@nestjs/common';
import { DietService } from './diet.service';
import { ControllerExceptionFilter, CreateDietDto, Diet, RoleGuard } from '@backend-evolved/shared';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { UpdateDietDto } from '../../../../libs/shared/src/dto/diet/update-diet.dto';

@Controller('diet')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class DietController {
	constructor(private readonly dietService: DietService) { }

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
	@UseFilters(ControllerExceptionFilter)
	async findAll(
		@Headers() headers: any,
		@Body('patientId') patientId: string,
		@Body('nutritionistId') nutritionistId: string
	): Promise<Diet[]> {
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
		return diet;
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
	@UseGuards(RoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async createDiet(
		@Body() createDietDto: CreateDietDto,
		@Headers() headers: any
	): Promise<Diet> {
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
	@UseGuards(RoleGuard(['nutritionist']))
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
	@UseGuards(RoleGuard(['nutritionist']))
	@UseFilters(ControllerExceptionFilter)
	async deleteDiet(
		@Param('dietId') dietId: string,
		@Headers() headers: any
	): Promise<void> {
		return await this.dietService.deleteOne({ id: dietId });
	}

}