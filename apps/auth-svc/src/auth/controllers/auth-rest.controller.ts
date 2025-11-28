import {
    Controller,
    Post,
    Body,
    UseFilters,
    Res,
    Get,
    UseGuards,
    UseInterceptors,
    HttpCode
} from '@nestjs/common';
import {
    LoginUserDto,
    RefreshTokenDto,
    ControllerExceptionFilter,
    LoginResponse,
    ResetPasswordDto,
    ForgotPasswordDto,
    ChangePasswordDto,
    ContextUser,
    JwtRoleGuard,
    ResetPasswordResponse,
    ROOT_ADMIN_EMAIL,
    GenerateAccessResponse,
    system,
    LoggingInterceptor,
    FirstLoginResponse,
    CustomLoggingInterceptor,
} from '@backend-evolved/shared';
import {
    ApiAcceptedResponse,
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiExcludeEndpoint,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiUnauthorizedResponse
} from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { KeyService } from '../../key/key.service';
import { TokenService } from '../services/token.service';

@Controller()
export class AuthRestController {
    constructor(
        private readonly authService: AuthService,
        private readonly keyService: KeyService,
        private readonly tokenService: TokenService
    ) { }

    @Get('health')
    @ApiExcludeEndpoint()
    @ApiOperation({
        summary: 'Check the health status of the authentication service'
    })
    healthCheck() {
        return { active: true };
    }

    @Get('jwks.json')
    @ApiOperation({
        summary: 'Get the JSON Web Key Set (JWKS) for token verification'
    })
    async getJwks() {
        const jwk = await this.keyService.getJwk();
        return { keys: [jwk] };
    }

    @Post(system.auth.controller.login.route)
    @HttpCode(200)
    @ApiOperation({
        summary: 'Login an user (patient or nutritionist)',
        description: 'Logs in an user using email and password, returning authentication tokens. If user is a patient and is the first login, the reset token of the password is returned instead.'
    })
    @ApiOkResponse({
        description: 'The user has been successfully logged in.',
        examples: {
            normalLogin: {
                summary: 'Normal login response',
                value: {
                    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "id": "user-uuid",
                    "role": "nutritionist"
                }
            },
            firstLogin: {
                summary: 'First login',
                value: {
                    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "firstLogin": true
                }
            }
        }
    })
    @ApiAcceptedResponse({
        description: 'The user account for a nutritionist have been created but an admin must activate it.',
        example: {
            "statusCode": 202,
            "message": "Your account has been successfully created, but it is currently under review. Please wait for approval to access all features."
        }
    })
    @ApiNotFoundResponse({
        description: 'Login was unsuccessfull',
        example: {
            "message": "Invalid password or email not found",
            "error": "Not Found",
            "statusCode": 404
        }
    })
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(new CustomLoggingInterceptor({
        transform: (data) => {
            return {
                role: data.role,
                id: data.id
            }
        }
    }))
    async login(@Body() body: LoginUserDto): Promise<LoginResponse | FirstLoginResponse> {
        return await this.authService.generalLogin(body);
    }

    @Post(system.auth.controller.refresh.route)
    @ApiOperation({ summary: 'Refresh user authentication token' })
    @ApiOkResponse({ description: 'The user authentication token has been successfully refreshed.' })
    @UseFilters(ControllerExceptionFilter)
    async refresh(@Body() body: RefreshTokenDto): Promise<LoginResponse> {
        return await this.tokenService.refresh(body)
    }

    @Post(system.auth.controller.resetPassword.route)
    @ApiOperation({
        summary: 'Reset user password using reset token',
        description: ''
    })
    @ApiOkResponse({
        description: 'The password was successfully changed, and a new access token was created.',
        example: {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "id": "user-uuid",
            "role": "nutritionist"
        }
    })
    @ApiUnauthorizedResponse({
        description: "Unauthorized access",
        example: {
            statusCode: 401,
            message: 'Invalid or expired reset token',
            error: "Unauthorized",
        },
    })
    @UseFilters(ControllerExceptionFilter)
    async resetPassword(@Body() body: ResetPasswordDto): Promise<LoginResponse> {
        return await this.authService.resetPassword(body);
    }

    @Post(system.auth.controller.forgotPassword.route)
    @ApiOperation({ summary: 'Request password reset token for an email' })
    @ApiOkResponse({ description: 'Returns a password reset token to be sent to the user.' })
    @UseFilters(ControllerExceptionFilter)
    async forgotPassword(@Body() body: ForgotPasswordDto): Promise<ResetPasswordResponse> {
        if (body.email === ROOT_ADMIN_EMAIL) return {}
        return await this.authService.forgotPassword(body.email);
    }

    @Post(system.auth.controller.changePassword.route)
    @ApiOperation({
        summary: 'Changes a logged user password',
        description: 'Unlike resetting a password, this requires both a valid access token and the current password to be provided.',
        security: [{ bearer: [] }]
    })
    @ApiOkResponse({
        description: 'The password was successfully changed, and a new access token was created.',
        example: {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "id": "user-uuid",
            "role": "nutritionist"
        }
    })
    @ApiBadRequestResponse({
        description: 'Current password is invalid',
        example: {
            "message": "Invalid password",
            "error": "Bad Request",
            "statusCode": 400
        }
    })
    @ApiBearerAuth('bearer')
    @ApiSecurity('bearer')
    @GenerateAccessResponse()
    @UseFilters(ControllerExceptionFilter)
    @UseGuards(JwtRoleGuard(['admin', 'nutritionist', 'patient']))
    async changePassword(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: ChangePasswordDto
    ): Promise<LoginResponse> {
        return await this.authService.changePassword(ctxUser, body);
    }
}