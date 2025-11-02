import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { PatientService } from './patient.service';
import { 
    JwtRoleGuard,
    ControllerExceptionFilter,
    ContextUser
} from '@backend-evolved/shared';

@Controller()
export class PatientRestController {
    constructor(
        private readonly patientService: PatientService,
    ) { }

    @Get('health')
    healthCheck() {
        return { active: true };
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(
        @ContextUser() ctxUser: ContextUser
    ) {
        return await this.patientService.findOneWhere({id: ctxUser.id});
    }
}