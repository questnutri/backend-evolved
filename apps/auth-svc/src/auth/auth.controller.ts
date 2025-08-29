import { Controller, Post, Body, UseFilters, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProxyMessengerFilter, LoginUserDto, ProxyMessage, RefreshTokenDto, RegisterUserDto, ControllerExceptionFilter, LoginTokenResponse, userId, User } from '@backend-evolved/shared';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { instanceToPlain } from 'class-transformer'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login an user' })
    @ApiOkResponse({ description: 'The user has been successfully logged in.' })
    @ApiAcceptedResponse({ description: 'The user account have been created but an admin must activate it.' })
    @UseFilters(ControllerExceptionFilter)
    async login(@Res() res: any, @Body() body: LoginUserDto): Promise<LoginTokenResponse> {
        const result = await this.authService.login(body);
        return res.status(200).json(result);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh user authentication token' })
    @ApiOkResponse({ description: 'The user authentication token has been successfully refreshed.' })
    @UseFilters(ControllerExceptionFilter)
    async refresh(@Body() body: RefreshTokenDto): Promise<LoginTokenResponse> {
        return await this.authService.refresh(body)
    }

    @MessagePattern('user.creation')
    @UseFilters(ProxyMessengerFilter)
    async handleUserCreation(@Payload() data: RegisterUserDto): Promise<ProxyMessage<userId>> {
        return { payload: (await this.authService.register(data)).id };
    }

    @MessagePattern('user.deletion')
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletionByEmail(@Payload() email: string): Promise<boolean> {
        console.log('Received user.deletion message with data:', email);
        try {
            await this.authService.deleteUser(email);
            return true;
        } catch (err: any) {
            console.log('Error in user.deletion handler:', err);
            throw new RpcException({
                detail: err?.message ?? String(err),
                source: err.constructor.name
            });
        }
    }

    @MessagePattern('nutritionist.approval')
    @UseFilters(ProxyMessengerFilter)
    async handleNutritionistApproval(@Payload() email: string): Promise<ProxyMessage<Partial<User>>> {
        console.log('Received nutritionist.approval message with data:', email);
        try {
            const user = await this.authService.approveNutritionist(email);
            return { payload: instanceToPlain(user) };
        } catch (err: any) {
            console.log('Error in nutritionist.approval handler:', err);
            throw new RpcException({
                detail: err?.message ?? String(err),
                source: err.constructor.name
            });
        }
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset user password using reset token' })
    @ApiOkResponse({ description: 'Password reset and new tokens returned.' })
    @UseFilters(ControllerExceptionFilter)
    async resetPassword(@Body() body: { resetPasswordToken: string; newPassword: string }) {
        return await this.authService.resetPassword(body);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset token for an email' })
    @ApiOkResponse({ description: 'Returns a password reset token to be sent to the user.' })
    @UseFilters(ControllerExceptionFilter)
    async forgotPassword(@Body() body: { email: string }) {
        return await this.authService.forgotPassword(body);
    }
}
