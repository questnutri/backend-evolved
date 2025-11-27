import {
    Controller,
    Get, Post,
    Body,
    Inject,
    UseGuards,
    UseFilters,
    InternalServerErrorException,
    NotFoundException,
    Query,
    Patch,
    UseInterceptors
} from '@nestjs/common';
import { NutritionistService } from '../nutritionist.service';
import {
    CreateNutritionistDto, PATIENT_SERVICE_PROXY_NAME,
    JwtRoleGuard,
    ControllerExceptionFilter, AUTH_SERVICE_PROXY_NAME, proxyPattern,
    ContextUser,
    sendProxyMessage,
    User, GenerateBadRequestResponse,
    NutritionistIncludeOptions,
    UpdateNutritionistDto,
    errorMessagePattern,
    removePropertyForOne,
    LoggingInterceptor
} from '@backend-evolved/shared';
import {
    ApiOkResponse,
    ApiOperation,
    ApiConflictResponse, ApiBearerAuth,
    ApiSecurity,
    ApiCreatedResponse,
    ApiExcludeEndpoint,
    ApiTags
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';

@ApiTags('Nutritionist')
@Controller()
export class NutritionistRestController {
    constructor(
        private readonly nutritionistService: NutritionistService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
    ) { }


    @Get('health')
    @ApiExcludeEndpoint()
    healthCheck() {
        return { active: true };
    }

    @Get('me')
    @ApiOperation({
        summary: 'Get information about the logged nutritionist',
        description: 'Retrieve the profile information of the currently logged-in nutritionist.'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @ApiOkResponse({
        description: 'Nutritionist data retrieved successfully', example: {
            "id": "012d3768-379c-4167-bc4a-56c99dc98a69",
            "documentType": "cpf",
            "documentNumber": "12345678901",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+55 12 93456-7890",
            "crn": "CRN-1/23456",
            "createdAt": "2023-10-01T12:34:56.789Z",
            "updatedAt": "2023-10-01T12:34:56.789Z"
        }
    })
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(
        @ContextUser() ctxUser: ContextUser,
        @Query() query: NutritionistIncludeOptions
    ): Promise<any> {
        let nutritionist = await this.nutritionistService.findOne({
            ...query,
            where: { id: ctxUser.id },
        });
        let userNutritionist = await sendProxyMessage<User>({
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

        nutritionist = removePropertyForOne(nutritionist, ['deletedAt']);
        userNutritionist = removePropertyForOne(userNutritionist, ['active'])

        return {
            ...nutritionist,
            ...userNutritionist
        };
    }

    @Patch('me')
    @ApiOperation({
        summary: 'Update information about the logged nutritionist',
        description: 'Update the profile information of the currently logged-in nutritionist.'
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @UseGuards(JwtRoleGuard(['nutritionist']))
    @UseFilters(ControllerExceptionFilter)
    async updateMe(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: Partial<UpdateNutritionistDto>
    ): Promise<any> {
        const foundNutritionist = await this.nutritionistService.findOne({ 
            where: { id: ctxUser.id },
            relations: ['addresses']
        });
        if(body.mainAddress) {
            const doesAddressBelongToNutritionist = foundNutritionist.addresses.some(addr => addr.id === body.mainAddress);
            if(!doesAddressBelongToNutritionist) {
                throw new NotFoundException(
                    errorMessagePattern.nutritionist.address.notFound.fn()
                )
            }
        }

        const updatedNutritionist = await this.nutritionistService.updateOne(foundNutritionist, body);
        return updatedNutritionist;
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new nutritionist' })
    @ApiCreatedResponse({
        description: 'Nutritionist registered successfully',
        example: {
            "message": "Nutritionist created successfully",
            "success": true,
            "id": "012d3768-379c-4167-bc4a-56c99dc98a69"
        }
    })
    @ApiConflictResponse({
        description: 'Data conflict on register',
        examples: {
            emailRegistered: {
                summary: "Email already registered",
                value: {
                    "message": "An User with this email already exists",
                    "error": "Conflict",
                    "statusCode": 409
                }
            }
        }
    })
    @ApiConflictResponse({ description: 'Nutritionist with given email already exists' })
    @ApiConflictResponse({ description: 'Nutritionist with given document already exists' })
    @GenerateBadRequestResponse({
        description: 'Invalid data for request',
        dto: CreateNutritionistDto,
        requests: {
            documentType: [
                "document type must be a valid type: [cnpj, cpf]"
            ],
        }
    })
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async register(@Body() body: CreateNutritionistDto) {
        const registeredNutritionist = await this.nutritionistService.createOne(body);
        if (registeredNutritionist) {
            return { message: `Nutritionist created successfully`, success: true, id: registeredNutritionist.id };
        }
        throw new InternalServerErrorException(`Error while creating a new account.`);
    }

}
