import { Body, Controller, Delete, Get, Inject, Param, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
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
            typeof proxyPattern.patient.getAll.response,
            typeof proxyPattern.patient.getAll.payload
        >({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.getAll.key,
            data: {
                where: {
                    nutritionistId
                },
                options: {
                    includeNutritionists: true
                }
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
        const patient = await sendProxyMessage<
            typeof proxyPattern.patient.getById.response,
            typeof proxyPattern.patient.getById.payload
        >({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.getById.key,
            data: { 
                id,
                options: {
                    includeDiets: true,
                    includeNutritionists: true
                }
            }
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

    @Delete(':id')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(PatientManagementLevel, "canDeletePatient")
    )
    @UseFilters(ControllerExceptionFilter)
    async deleteOneById(
        @Param('id') id: string
    ) {
        return await sendProxyMessage<void>({
            proxy: this.patientProxy,
            pattern: proxyPattern.patient.softDeletionById.key,
            data: { id }
        })
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