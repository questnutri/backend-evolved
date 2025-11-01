import { 
    Controller,
    Post,
    Body,
    UseFilters,
    Res,
    Get,
    UseGuards
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
} from '@backend-evolved/shared';
import {
    ApiAcceptedResponse,
    ApiOkResponse,
    ApiOperation
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
    healthCheck() {
        return { active: true };
    }

    @Get('jwks.json')
    async getJwks() {
        const jwk = await this.keyService.getJwk();
        return { keys: [jwk] };
    }

    @Post('login')
    @ApiOperation({ summary: 'Login an user' })
    @ApiOkResponse({ description: 'The user has been successfully logged in.' })
    @ApiAcceptedResponse({ description: 'The user account have been created but an admin must activate it.' })
    @UseFilters(ControllerExceptionFilter)
    async login(@Res() res: any, @Body() body: LoginUserDto): Promise<LoginResponse> {
        const result = await this.authService.generalLogin(body);
        return res.status(200).json(result);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh user authentication token' })
    @ApiOkResponse({ description: 'The user authentication token has been successfully refreshed.' })
    @UseFilters(ControllerExceptionFilter)
    async refresh(@Body() body: RefreshTokenDto): Promise<LoginResponse> {
        return await this.tokenService.refresh(body)
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset user password using reset token' })
    @ApiOkResponse({ description: 'Password reset and new tokens returned.' })
    @UseFilters(ControllerExceptionFilter)
    async resetPassword(@Body() body: ResetPasswordDto): Promise<LoginResponse> {
        return await this.authService.resetPassword(body);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset token for an email' })
    @ApiOkResponse({ description: 'Returns a password reset token to be sent to the user.' })
    @UseFilters(ControllerExceptionFilter)
    async forgotPassword(@Body() body: ForgotPasswordDto): Promise<ResetPasswordResponse> {
        return await this.authService.forgotPassword(body.email);
    }

    @Post('change-password')
    @ApiOperation({ summary: 'Changes a logged user password' })
    @UseFilters(ControllerExceptionFilter)
    @UseGuards(JwtRoleGuard(['admin', 'nutritionist', 'patient']))
    async changePassword(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: ChangePasswordDto
    ): Promise<LoginResponse> {
        return await this.authService.changePassword(ctxUser, body);
    }
}