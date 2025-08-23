import { Controller, Get, Post, Body, Param, Inject, UseGuards, Headers } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import { BodyCreatePatientDto, CreateNutritionistDto, CreatePatientDto, FindAllFromNutritionistPayload, Patient, PATIENT_SERVICE_PROXY_NAME, RoleGuard } from '@backend-evolved/shared';
import { ApiOkResponse, ApiOperation, ApiConflictResponse, ApiBadRequestResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
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
    register(@Body() body: CreateNutritionistDto) {
        return this.nutritionistService.create(body);
    }

    @Post('patients')
    @ApiOperation({ summary: 'Create a new patient for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({ description: 'Patient created successfully' })
    @UseGuards(RoleGuard(['nutritionist', 'admin']))
    async createPatient(
        @Headers() headers: { 'user-id': string },
        @Body() body: BodyCreatePatientDto
    ) {
        return await firstValueFrom(
            this.patientServiceProxy.send<Patient, CreatePatientDto>
                ('patient.creation', { ...body, nutritionistId: headers['user-id'] })
        );
    }

    @Get('patients')
    @ApiOperation({ summary: 'Get all patients for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({ description: 'Patients retrieved successfully' })
    @UseGuards(RoleGuard(['nutritionist', 'admin']))
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

    // @Get()
    // findAll() {
    //     return this.nutritionistService.findAll();
    // }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.nutritionistService.findOne(+id);
    // }
}
