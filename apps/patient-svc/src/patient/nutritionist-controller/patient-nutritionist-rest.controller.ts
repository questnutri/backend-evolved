import { Body, Controller, Get, Post, UseFilters, UseGuards } from '@nestjs/common';
import { PatientService } from '../patient.service';
import {
    JwtRoleGuard,
    ControllerExceptionFilter,
    ContextUser,
    BodyCreatePatientDto,
    IsRelatedGuard,
    Patient,
    proxyPattern,
    sendProxyMessage
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
        return await this.patientService.createOne({...body, nutritionistId: ctxUser.id});
    }

}