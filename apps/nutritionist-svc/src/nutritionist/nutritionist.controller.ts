import { Controller, Get, Post, Body, Inject, UseGuards, Headers, UseFilters } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import { BodyCreatePatientDto, CreateNutritionistDto, CreatePatientDto, FindAllFromNutritionistPayload, ProxyMessage, Patient, PATIENT_SERVICE_PROXY_NAME, RoleGuard, ControllerExceptionFilter } from '@backend-evolved/shared';
import { ApiOkResponse, ApiOperation, ApiConflictResponse, ApiBadRequestResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';


@Controller('nutritionist')
export class NutritionistController {
    constructor(
        private readonly nutritionistService: NutritionistService,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new nutritionist' })
    @ApiOkResponse({ description: 'Nutritionist registered successfully' })
    @ApiConflictResponse({ description: 'Nutritionist with given email already exists' })
    @ApiConflictResponse({ description: 'Nutritionist with given document already exists' })
    @ApiBadRequestResponse({ description: 'Invalid data' })
    @UseFilters(ControllerExceptionFilter)
    async register(@Body() body: CreateNutritionistDto) {
        return await this.nutritionistService.createOne(body);
    }

    @Post('patients')
    @ApiOperation({ summary: 'Create a new patient for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({ description: 'Patient created successfully' })
    @UseGuards(RoleGuard(['nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async createPatient(
        @Headers() headers: { 'user-id': string },
        @Body() body: BodyCreatePatientDto
    ) {
        try {
            const result = await firstValueFrom(
                this.patientServiceProxy.send<ProxyMessage<Patient>, CreatePatientDto>
                    ('patient.creation', { ...body, nutritionistId: headers['user-id'] }));

            if (result && 'error' in result) {
                throw new RpcException(result);
            }

            return result.payload;

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    @Get('patients')
    @ApiOperation({ summary: 'Get all patients for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({ description: 'Patients retrieved successfully' })
    @UseGuards(RoleGuard(['nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async getAllPatients(
        @Headers() headers: { 'user-id': string },
    ) {
        return await firstValueFrom(
            this.patientServiceProxy.send<
                Patient[],
                FindAllFromNutritionistPayload
            >
                ('patient.findAllFromNutritionist',
                    {
                        nutritionistId: headers['user-id']
                    }
                )
        );
    }
}
