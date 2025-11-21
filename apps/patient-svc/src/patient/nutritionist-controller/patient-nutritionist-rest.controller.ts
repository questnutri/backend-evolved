import { Body, Controller, Get, NotFoundException, Param, Post, UseFilters, UseGuards } from '@nestjs/common';
import { PatientService } from '../patient.service';
import {
    JwtRoleGuard,
    ControllerExceptionFilter,
    ContextUser,
    BodyCreatePatientDto,
    IsRelatedGuard,
    Patient,
    proxyPattern,
    sendProxyMessage,
    errorMessagePattern
} from '@backend-evolved/shared';
import { ApiOperation, ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Nutritionist Interactions')
@Controller()
export class PatientNutritionistRestController {
    constructor(
        private readonly patientService: PatientService,
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

    @Get(':patientId')
    @ApiOperation({ summary: 'Get patient details by ID for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getPatientById(
        @Param('patientId') patientId: string,
        @ContextUser() ctxUser: ContextUser,
    ): Promise<Patient> {
        const foundPatient = await this.patientService.findOneWhere({ id: patientId });
        if (foundPatient.hasNutritionist(ctxUser.id)) {
            return foundPatient;
        }
        throw new NotFoundException(
            errorMessagePattern
                .patient
                .notFound
                .key
        );

    }

}