import { 
    Controller,
    Post,
    Body,
    Inject,
    UseGuards,
    UseFilters,
    Param,
    Query,
    Get
} from '@nestjs/common';

import {
    BodyCreatePatientDto,
    Patient,
    PATIENT_SERVICE_PROXY_NAME,
    JwtRoleGuard,
    ControllerExceptionFilter, proxyPattern,
    ContextUser,
    sendProxyMessage,
    IsRelatedGuard,
    ProxyWaterGoalDto,
    CreateWaterGoalDto,
    FindCurrentWaterGoalDto
} from '@backend-evolved/shared';
import {
    ApiOkResponse,
    ApiOperation,
    ApiBearerAuth,
    ApiSecurity,
    ApiCreatedResponse
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';

@Controller('patients')
export class PatientRestController {
    constructor(
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all patients for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({ description: 'Patients retrieved successfully' })
    @UseGuards(JwtRoleGuard(['nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async getAllPatients(
        @ContextUser() ctxUser: ContextUser
    ): Promise<Patient[]> {
        return await sendProxyMessage<Patient[]>({
            proxy: this.patientServiceProxy,
            pattern: proxyPattern.patient.findAllFromNutritionist,
            data: { nutritionistId: ctxUser.id } //gets from JWT!
        });
    }

    @Post()
    @ApiOperation({ summary: 'Create a new patient for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiCreatedResponse({ description: 'Patient created successfully' })
    @UseGuards(
        JwtRoleGuard(['nutritionist', 'admin']),
        IsRelatedGuard({
            on: 'body',
            withKeys: ['nutritionistId'],
            adminBypass: true,
            errorMessage: () => 'Nutritionist can only create patients for himself'

        })
    )
    @UseFilters(ControllerExceptionFilter)
    async createPatient(
        @Body() body: BodyCreatePatientDto
    ): Promise<Patient> {
        return await sendProxyMessage<Patient, BodyCreatePatientDto>({
            proxy: this.patientServiceProxy,
            pattern: proxyPattern.patient.creation,
            data: body,
        });
    }

    @Post(':patientId/water')
    @ApiOperation({ summary: 'Create a water goal for a patient' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiCreatedResponse({ description: 'Water goal created successfully' })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async createWaterGoal(
        @Param('patientId') patientId: string,
        @ContextUser() ctxUser: ContextUser,
        @Body() body: CreateWaterGoalDto
    ): Promise<any> {
        return await sendProxyMessage<any, ProxyWaterGoalDto>({
            proxy: this.patientServiceProxy,
            pattern: proxyPattern.patient.water.creation,
            data: { patientId, nutritionistId: ctxUser.id, ...body },
        });
    }

    @Get(':patientId/water/current')
    @ApiOperation({ summary: 'Find current water goal for a patient' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({ description: 'Current water goal retrieved successfully' })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async findCurrentWaterGoal(
        @Param('patientId') patientId: string,
        @Query('date') date: Date,
        @ContextUser() ctxUser: ContextUser,
    ): Promise<any> {
        return await sendProxyMessage<any, FindCurrentWaterGoalDto>({
            proxy: this.patientServiceProxy,
            pattern: proxyPattern.patient.water.findCurrent,
            data: { patientId, nutritionistId: ctxUser.id, requestDate: date },
        });
    }

}
