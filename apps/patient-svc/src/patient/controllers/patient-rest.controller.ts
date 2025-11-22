import { Body, Controller, Get, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
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
    PatientIncludeOptions
} from '@backend-evolved/shared';
import { ApiOperation, ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { DietIncludeOptions } from '../../../../../libs/shared/src/dto/queries';

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
        return await this.patientService.findOne({
            where: { id: ctxUser.id },
            ...query,
            removeKeys: query?.includeNutritionists ? [] : ['nutritionists']
        });
    }

    @Post('test-register')
    async testRegister(
        @Body() data: BodyCreatePatientDto
    ): Promise<any> {
        return await this.patientService.createOneV2(data);
    }

}