import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RefreshTokenDto, RegisterUserDto } from '@backend-evolved/shared';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login an user' })
    @ApiOkResponse({ description: 'The user has been successfully logged in.' })
    @ApiAcceptedResponse({ description: 'The user account have been created but an admin must activate it.' })
    async login(@Body() body: LoginUserDto) {
        return await this.authService.login(body)
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh user authentication token' })
    @ApiOkResponse({ description: 'The user authentication token has been successfully refreshed.' })
    async refresh(@Body() body: RefreshTokenDto) {
        return await this.authService.refresh(body)
    }

    @MessagePattern('user.creation')
    async handleUserCreation(@Payload() data: RegisterUserDto) {
        console.log('Received user.creation message with data:', data);
        try {
            const user = await this.authService.register(data);
            return user.id;
        } catch (err: any) {
            console.log('Error in user.creation handler:', err);
            throw new RpcException({
                detail: err?.message ?? String(err),
                source: err.constructor.name
            });
        }
    }

    @MessagePattern('user.deletion')
    async handleUserDeletionByEmail(@Payload() email: string) {
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
    async handleNutritionistApproval(@Payload() email: string) {
        console.log('Received nutritionist.approval message with data:', email);
        try {
            const user = await this.authService.approveNutritionist(email);
            return user;
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
    async resetPassword(@Body() body: { resetPasswordToken: string; newPassword: string }) {
        return await this.authService.resetPassword(body);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset token for an email' })
    @ApiOkResponse({ description: 'Returns a password reset token to be sent to the user.' })
    async forgotPassword(@Body() body: { email: string }) {
        return await this.authService.forgotPassword(body);
    }
}
