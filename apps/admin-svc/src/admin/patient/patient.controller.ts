import { Controller, Get, Inject, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    AUTH_SERVICE_PROXY_NAME,
    ControllerExceptionFilter,
    JwtRoleGuard,
    Patient,
    PATIENT_SERVICE_PROXY_NAME,
    PatientManagementLevel,
    proxyPattern,
    sendProxyMessage,
    User
} from '@backend-evolved/shared';
import { ManagementGuard } from '../../guards/management.guard';

type PatientUser = Patient & User;

@Controller('patient')
export class PatientController {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientProxy: ClientProxy
    ) { }

    @Get('all')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(PatientManagementLevel, "canViewPatients")
    )
    @UseFilters(ControllerExceptionFilter)
    async getAll() {
        return await sendProxyMessage<Patient[]>({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.getAll
        })
    }

    @Get(':id')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(PatientManagementLevel, "canViewPatientProfile")
    )
    @UseFilters(ControllerExceptionFilter)
    async getOneById(
        @Param('id') id: string
    ): Promise<PatientUser> {
        const patient = await sendProxyMessage<Patient>({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.getById,
            data: { id }
        });

        const userPatient = await sendProxyMessage<User>({
            proxy: this.authServiceProxy,
            pattern: proxyPattern.user.getOneById,
            data: { id: patient.id },
            options: {
                retry: { count: 5, delay: 50 }
            }
        });

        return {
            ...userPatient,
            ...patient
        }
    }
}