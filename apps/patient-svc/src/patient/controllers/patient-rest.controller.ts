import { Body, Controller, Get, Patch, Query, UseFilters, UseGuards } from '@nestjs/common';
import { PatientService } from '../patient.service';
import {
    JwtRoleGuard,
    ControllerExceptionFilter,
    ContextUser, PatientIncludeOptions,
    DietIncludeOptions,
    UpdatePatientDto_Patient
} from '@backend-evolved/shared';
import {
    ApiOperation,
    ApiBearerAuth,
    ApiSecurity,
    ApiTags,
    ApiExcludeEndpoint
} from '@nestjs/swagger';

@ApiTags('Patient Interactions')
@Controller()
export class PatientRestController {
    constructor(
        private readonly patientService: PatientService,
    ) { }

    @Get('health')
    @ApiExcludeEndpoint()
    healthCheck() {
        return { active: true };
    }

    @Get('me')
    @ApiOperation({
        summary: 'Get information about the logged patient'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(
        @ContextUser() ctxUser: ContextUser,
        @Query() query: PatientIncludeOptions & DietIncludeOptions,
    ) {
        return await this.patientService.findOne(
            ctxUser,
            {
                where: { id: ctxUser.id },
                ...query,
                removeKeys: query?.includeNutritionists ? [] : ['nutritionists'],
            });
    }

    @Patch('me')
    @ApiOperation({
        summary: 'Update information about the logged patient'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async updateMe(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: UpdatePatientDto_Patient,
    ) {
        const patient = await this.patientService.findOne(
            ctxUser,
            {
                where: { id: ctxUser.id },
            });
        return await this.patientService.updateOne(patient, body);
    }

}