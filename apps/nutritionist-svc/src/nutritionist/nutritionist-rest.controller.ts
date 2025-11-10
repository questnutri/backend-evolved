import { Controller, Get, Post, Body, Inject, UseGuards, UseFilters, InternalServerErrorException, NotFoundException, UseInterceptors } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import {
    BodyCreatePatientDto,
    CreateNutritionistDto, Patient,
    PATIENT_SERVICE_PROXY_NAME,
    JwtRoleGuard,
    ControllerExceptionFilter, AUTH_SERVICE_PROXY_NAME, proxyPattern,
    ContextUser,
    sendProxyMessage,
    User,
    IsRelatedGuard,
    LogInjector,
    ContextLog
} from '@backend-evolved/shared';
import { ApiOkResponse, ApiOperation, ApiConflictResponse, ApiBadRequestResponse, ApiBearerAuth, ApiSecurity, ApiCreatedResponse } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class NutritionistRestController {
    constructor(
        private readonly nutritionistService: NutritionistService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
    ) { }


    @Get('health')
    healthCheck() {
        return { active: true };
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(@ContextUser() ctxUser: ContextUser): Promise<any> {
        const nutritionist = await this.nutritionistService.findOneWhere({ id: ctxUser.id });
        if (!nutritionist) throw new NotFoundException("Nutritionist not found");
        const userNutritionist = await sendProxyMessage<User>({
            proxy: this.authServiceProxy,
            pattern: proxyPattern.user.getOneById,
            data: { id: ctxUser.id },
            options: {
                retry: {
                    count: 1,
                    delay: 5000,
                }
            }
        })

        return {
            ...nutritionist,
            ...userNutritionist
        };
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new nutritionist' })
    @ApiCreatedResponse({ description: 'Nutritionist registered successfully' })
    @ApiConflictResponse({ description: 'Nutritionist with given email already exists' })
    @ApiConflictResponse({ description: 'Nutritionist with given document already exists' })
    @ApiBadRequestResponse({ description: 'Invalid data' })
    @UseFilters(ControllerExceptionFilter)
    async register(@Body() body: CreateNutritionistDto) {
        const registeredNutritionist = await this.nutritionistService.createOne(body);
        if (registeredNutritionist) {
            return { message: `Nutritionist created successfully`, success: true, id: registeredNutritionist.id };
        }
        console.error(`Method nutritionist.controller.createOne has not returned a valid nutritionist and did not trigger any error while doing it. Returned value: ${registeredNutritionist}`);
        throw new InternalServerErrorException(`Error while creating a new account.`);
    }

    @Get('patients')
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

    @Post('patients')
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
    @UseInterceptors(LogInjector)
    async createPatient(
        @ContextUser() ctxUser: ContextUser,
        @ContextLog() contextLog: ContextLog,
        @Body() body: BodyCreatePatientDto,
    ): Promise<Patient> {
        console.log("[NutritionistRestController] Creating patient with context log id:", contextLog.id);
        return await sendProxyMessage<Patient, BodyCreatePatientDto>({
            proxy: this.patientServiceProxy,
            pattern: proxyPattern.patient.creation,
            data: body,
            contextLog
        });
    }

}
