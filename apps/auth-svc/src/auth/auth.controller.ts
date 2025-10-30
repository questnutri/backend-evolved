import { Controller, Post, Body, UseFilters, Res, Get, UseInterceptors, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { 
    LoggingInterceptor,
    ProxyMessengerFilter,
    LoginUserDto,
    ProxyMessage,
    RefreshTokenDto,
    RegisterUserDto,
    ControllerExceptionFilter,
    LoginTokenResponse,
    userId,
    User,
    ResetPasswordDto,
    ForgotPasswordDto,
    ResetTokenDto,
    KeysOf,
    proxyPattern,
    ChangePasswordDto,
    JwtGuard,
    ContextUser,
    JwtRoleGuard
} from '@backend-evolved/shared';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { instanceToPlain } from 'class-transformer';
import { KeyService } from '../key/key.service';

@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly keyService: KeyService
    ) { }

    @Get('health')
    healthCheck() {
        return { active: true };
    }

    @Post('login')
    @ApiOperation({ summary: 'Login an user' })
    @ApiOkResponse({ description: 'The user has been successfully logged in.' })
    @ApiAcceptedResponse({ description: 'The user account have been created but an admin must activate it.' })
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async login(@Res() res: any, @Body() body: LoginUserDto): Promise<LoginTokenResponse> {
        const result = await this.authService.login(body);
        return res.status(200).json(result);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh user authentication token' })
    @ApiOkResponse({ description: 'The user authentication token has been successfully refreshed.' })
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async refresh(@Body() body: RefreshTokenDto): Promise<LoginTokenResponse> {
        return await this.authService.refresh(body)
    }


    @Post('reset-password')
    @ApiOperation({ summary: 'Reset user password using reset token' })
    @ApiOkResponse({ description: 'Password reset and new tokens returned.' })
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async resetPassword(@Body() body: ResetPasswordDto): Promise<LoginTokenResponse> {
        return await this.authService.resetPassword(body);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset token for an email' })
    @ApiOkResponse({ description: 'Returns a password reset token to be sent to the user.' })
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async forgotPassword(@Body() body: ForgotPasswordDto): Promise<ResetTokenDto> {
        return await this.authService.forgotPassword(body);
    }

    @Post('change-password')
    @ApiOperation({summary: 'Changes a logged user password'})
    @UseFilters(ControllerExceptionFilter)
    @UseGuards(JwtRoleGuard(['admin', 'nutritionist', 'patient']))
    async changePassword(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: ChangePasswordDto
    ): Promise<LoginTokenResponse> {
        console.log(ctxUser);
        return await this.authService.changePassword(ctxUser, body);
    }

    @Get('jwks.json')
    async getJwks() {
        const jwk = await this.keyService.getJwk();
        return { keys: [jwk] };
    }


    @MessagePattern(proxyPattern.user.creation)
    @UseFilters(ProxyMessengerFilter)
    async handleUserCreation(@Payload() data: RegisterUserDto): Promise<ProxyMessage<userId>> {
        return { payload: (await this.authService.register(data)).id };
    }

    @MessagePattern(proxyPattern.user.deletionByEmail)
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletionByEmail(@Payload() payload: { email: string }): Promise<ProxyMessage<{ result: boolean }>> {
        try {
            await this.authService.deleteUserByEmail(payload.email);
            return { payload: { result: true } };
        } catch (err: any) {
            console.log('Error in user.deletion handler:', err);
            throw new RpcException({
                detail: err?.message ?? String(err),
                source: err.constructor.name
            });
        }
    }

    @MessagePattern(proxyPattern.user.getAll)
    @UseFilters(ProxyMessengerFilter)
    async handleGetAll(@Payload() data: { query: Partial<KeysOf<User>> }): Promise<ProxyMessage<User[]>> {
        const users = await this.authService.findAll(data.query);
        return { payload: users };
    }

    @MessagePattern(proxyPattern.user.getManyByIds)
    @UseFilters(ProxyMessengerFilter)
    async handleGetManyByIds(@Payload() data: { ids: string[] }): Promise<ProxyMessage<User[]>> {
        const users = (await this.authService.findManyByIds(data.ids))
            .map(user => instanceToPlain(user) as User); //removes passwordHash
        return { payload: users };
    }

    @MessagePattern(proxyPattern.user.getOneById)
    @UseFilters(ProxyMessengerFilter)
    async getOneById(@Payload() data: { id: string }): Promise<ProxyMessage<Partial<User>>> {
        return { payload: instanceToPlain(await this.authService.findOne({ id: data.id })) };
    }


    @MessagePattern(proxyPattern.nutritionist.approval)
    @UseFilters(ProxyMessengerFilter)
    async handleNutritionistApproval(@Payload() email: string): Promise<ProxyMessage<Partial<User>>> {
        const user = await this.authService.approveNutritionist(email);
        return { payload: instanceToPlain(user) };
    }

    @MessagePattern(proxyPattern.admin.login)
    @UseFilters(ProxyMessengerFilter)
    async handleAdminLogin(@Payload() data: { email: string, password: string }): Promise<ProxyMessage<LoginTokenResponse>> {
        try {
            const result = await this.authService.loginAdmin(data.email, data.password);
            console.log(result);
            return { payload: result };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    @MessagePattern(proxyPattern.user.deletionById)
    @UseFilters(ProxyMessengerFilter)
    async handleUserDeletion(@Payload() data: { id: string }): Promise<ProxyMessage<{ result: boolean }>> {
        await this.authService.deleteOneById(data.id);
        return { payload: { result: true } };
    }

}
