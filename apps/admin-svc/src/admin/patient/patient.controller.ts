import { Body, Controller, Get, Inject, Param, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    AUTH_SERVICE_PROXY_NAME,
    BodyCreatePatientDto,
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

//FIXME: FIX THIS CONTROLLER
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
    async getAllPatients(
        @Query('nutritionistId') nutritionistId?: string
    ) {
        const patients = await sendProxyMessage<
            typeof proxyPattern.patient.getAll.receive,
            typeof proxyPattern.patient.getAll.payload
        >({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.getAll.key,
            data: {
                nutritionistId
            }
        })
        return patients;
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
        } as any;
    }

    @Post()
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(PatientManagementLevel, "canCreatePatient")
    )
    @UseFilters(ControllerExceptionFilter)
    async create(
        @Body() body: typeof proxyPattern.patient.creation.payload
    ) {
        return await sendProxyMessage<Patient>({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.creation.key,
            data: body
        });
    }



}