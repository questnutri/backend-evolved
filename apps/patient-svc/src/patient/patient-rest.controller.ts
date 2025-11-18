import { Body, Controller, Get, Post, UseFilters, UseGuards } from '@nestjs/common';
import { PatientService } from './patient.service';
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
import { ApiOperation, ApiBearerAuth, ApiSecurity, ApiCreatedResponse, ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

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
        @ContextUser() ctxUser: ContextUser
    ) {
        return await this.patientService.findOneWhere({ id: ctxUser.id });
    }

}