import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
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
    normalizeToList,
    UpdatePatientDto_Nutritionist,
    removePropertyForOne,
    WeightRecord,
    UserRole
} from '@backend-evolved/shared';
import { ApiOperation, ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { PatientNutritionistService } from '../../../patient-nutritionist/patient-nutritionist.service';
import { request } from 'http';

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
        return await this.patientService.createOne({ ...body, nutritionistId: ctxUser.id } as any);
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

        const patientRelations = await this.patientNutritionistService.findAll(
            {
                where: { nutritionistId: ctxUser.id },
                page,
                limit,
            });
        if (patientRelations.length === 0) return normalizeToList([], 0, 1, 20);
        const patientIds = new Set<string>();
        patientRelations.forEach(relation => {
            patientIds.add(relation.patientId);
        });

        return await this.patientService.findManyByIds(
            Array.from(patientIds), ctxUser, {
            ...query,
            ...FilterQuery.forClass(Patient).withKeys(['name', 'email', "documentNumber"]).filter(filter),
            ...SelectQuery.forClass(Patient).select(select),
            ...includeDiets ? { includeDiets: false } : {},
            includeLastWeight: false,
            removeKeys: [
                'nutritionists',
                'deletedAt'
            ],
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
        let foundRelation = await this.patientNutritionistService.findOne({
            nutritionistId: ctxUser.id,
            patientId
        });

        let patient = await this.patientService.applyIncludeOptionsOnOne(
            {
                ...query,
                includeLastWeight: true,
                includeNutritionists: false
            },
            foundRelation.patient,
            ctxUser
        );
        patient = this.patientService.applyHealthCalculation(patient);

        let lastWeight = ((patient as any).lastWeight as WeightRecord)

        if (
            lastWeight &&
            lastWeight.registeredBy &&
            lastWeight.registeredBy.role === UserRole.NUTRITIONIST &&
            lastWeight.registeredBy.userId !== ctxUser.id
        ) {
            lastWeight = {
                ...lastWeight,
                registeredBy: {
                    role: UserRole.PATIENT,
                    userId: patient.id
                }
            };
            (patient as any).lastWeight = lastWeight;
        }

        foundRelation = removePropertyForOne(foundRelation, [
            'patient',
            'patientId',
            'nutritionistId',
            'deletedAt'
        ]);

        return {
            ...patient,
            ...foundRelation
        } as unknown as Patient;
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
        @Body() body: UpdatePatientDto_Nutritionist
    ): Promise<Patient> {
        const foundRelation = await this.patientNutritionistService.findOnePatient({
            nutritionistId: ctxUser.id,
            patientId
        });
        return await this.patientService.updateOne(
            foundRelation,
            body as any
        );
    }

    @Delete(':patientId')
    @ApiOperation({ summary: 'Update patient details by ID for logged nutritionist' })
    @ApiOkResponse({ description: 'Patient details updated successfully', type: Patient })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async deletePatientById(
        @Param('patientId') patientId: string,
        @ContextUser() ctxUser: ContextUser,
        @Body() body: UpdatePatientDto_Nutritionist
    ): Promise<void> {
        const foundRelation = await this.patientNutritionistService.findOne({
            nutritionistId: ctxUser.id,
            patientId
        });
        await this.patientNutritionistService.deleteOne(foundRelation);
    }

}