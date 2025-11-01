import { Controller, Get, Post, Body, Inject, UseGuards, Headers, UseFilters, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import {
    BodyCreatePatientDto,
    CreateNutritionistDto,
    CreatePatientDto,
    FindAllFromNutritionistPayload,
    ProxyMessage,
    Patient,
    PATIENT_SERVICE_PROXY_NAME,
    JwtRoleGuard,
    ControllerExceptionFilter, AUTH_SERVICE_PROXY_NAME, proxyPattern,
    ContextUser,
    sendProxyMessage,
    User
} from '@backend-evolved/shared';
import { ApiOkResponse, ApiOperation, ApiConflictResponse, ApiBadRequestResponse, ApiBearerAuth, ApiSecurity, ApiCreatedResponse } from '@nestjs/swagger';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class NutritionistRestController {
    constructor(
        private readonly nutritionistService: NutritionistService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
    ) { }

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
        @Headers() headers: { 'user-id': string },
    ): Promise<Patient[]> {
        const result = await firstValueFrom(
            this.patientServiceProxy.send<
                ProxyMessage<Patient[]>,
                FindAllFromNutritionistPayload
            >
                ('patient.findAllFromNutritionist',
                    {
                        nutritionistId: headers['user-id']
                    }
                )
        );
        if (result && "error" in result) {
            throw new RpcException(result);
        }
        return result.payload;
    }

    @Post('patients')
    @ApiOperation({ summary: 'Create a new patient for logged nutritionist' })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiCreatedResponse({ description: 'Patient created successfully' })
    @UseGuards(JwtRoleGuard(['nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async createPatient(
        @Headers() headers: { 'user-id': string },
        @Body() body: BodyCreatePatientDto
    ): Promise<Patient> {
        console.log(`Trying to create a new patient for nutritionist ${headers['user-id']}`);
        console.log(body);
        try {
            console.log('Sending creation request to patient service...');
            const result = await firstValueFrom(
                this.patientServiceProxy.send<ProxyMessage<Patient>, CreatePatientDto>
                    ('patient.creation', { ...body, nutritionistId: headers['user-id'] }));
            console.log('Received response from patient service:');
            console.log(result);
            if (result && 'error' in result) {
                throw new RpcException(result);
            }

            return result.payload;

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    @Get('health')
    healthCheck() {
        return { active: true };
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(@ContextUser() user: ContextUser): Promise<any> {
        const nutritionist = await this.nutritionistService.findOne({id: user.id});
        if (!nutritionist) throw new NotFoundException("Nutritionist not found");
        const userNutritionist = await sendProxyMessage<User>({
            proxy: this.authServiceProxy,
            pattern: proxyPattern.user.getOneById,
            data: {id: user.id},
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
}
