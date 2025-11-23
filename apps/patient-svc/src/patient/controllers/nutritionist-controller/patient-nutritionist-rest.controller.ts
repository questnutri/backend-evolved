import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { PatientService } from '../../patient.service';
import {
    JwtRoleGuard,
    ControllerExceptionFilter,
    ContextUser,
    BodyCreatePatientDto,
    Patient,
    PaginationQuery,
    PatientIncludeOptions,
    SelectQuery,
    DietIncludeOptions,
    FilterQuery,
    ListResponse,
    normalizeToList
} from '@backend-evolved/shared';
import { ApiOperation, ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { PatientNutritionistService } from '../../../patient-nutritionist/patient-nutritionist.service';

@ApiTags('Nutritionist Interactions')
@Controller()
export class PatientNutritionistRestController {
    constructor(
        private readonly patientService: PatientService,
        private readonly patientNutritionistService: PatientNutritionistService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Create a new patient for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiCreatedResponse({ description: 'Patient created successfully' })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async createPatient(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: BodyCreatePatientDto
    ): Promise<Patient> {
        return await this.patientService.createOne({ ...body, nutritionistId: ctxUser.id });
    }

    @Get('all')
    @ApiOperation({ summary: 'Get all patients for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getAllPatients(
        @ContextUser() ctxUser: ContextUser,
        @Query('filter') filter: string,
        @Query('select') select: string,
        @Query() query:
            PaginationQuery &
            Omit<PatientIncludeOptions, keyof DietIncludeOptions | 'includeWeights'>,
    ): Promise<ListResponse<Patient>> {
        const { includeDiets, page, limit } = query;

        const patientRelations = await this.patientNutritionistService.findAll({
            where: { nutritionistId: ctxUser.id },
            page, limit
        });
        if (patientRelations.length === 0) return normalizeToList([], 0, 1, 20);
        const patientIds = new Set<string>();
        patientRelations.forEach(relation => {
            patientIds.add(relation.patientId);
        });

        return await this.patientService.findManyByIds(
            Array.from(patientIds), {
            ...query,
            ...FilterQuery.forClass(Patient).withKeys(['name', 'email', "documentNumber"]).filter(filter),
            ...SelectQuery.forClass(Patient).select(select),
            ...includeDiets ? { includeDiets: true } : {},
            includeLastWeight: false,
            removeKeys: ['nutritionists']
        });
    }

    @Get(':patientId')
    @ApiOperation({ summary: 'Get patient details by ID for logged nutritionist' })
    @ApiOkResponse({ description: 'Patient details retrieved successfully', type: Patient })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getPatientById(
        @Param('patientId') patientId: string,
        @ContextUser() ctxUser: ContextUser,
        @Query() query:
            PaginationQuery &
            PatientIncludeOptions,
    ): Promise<Patient> {
        const foundRelation = await this.patientNutritionistService.findOneWhere({
            nutritionistId: ctxUser.id,
            patientId
        });
        return await this.patientService.findOne({
            where: { id: foundRelation.id },
            ...query,
            includeMeals: false,
            removeKeys: ['nutritionists']
        });
    }

    @Patch(':patientId')
    @ApiOperation({ summary: 'Update patient details by ID for logged nutritionist' })
    @ApiOkResponse({ description: 'Patient details updated successfully', type: Patient })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async updatePatientById(
        @Param('patientId') patientId: string,
        @ContextUser() ctxUser: ContextUser,
        @Body() body: Partial<BodyCreatePatientDto>
    ): Promise<Patient> {
        const foundRelation = await this.patientNutritionistService.findOneWhere({
            nutritionistId: ctxUser.id,
            patientId
        });
        return await this.patientService.updateOne(
            foundRelation,
            body
        );
    }

}