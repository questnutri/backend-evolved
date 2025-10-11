import { Controller, Body, Post, Inject, UseGuards, UseFilters, Get, Headers, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AUTH_SERVICE_PROXY_NAME, ControllerExceptionFilter, JwtRoleGuard, LoginTokenResponse, LoginUserDto, Nutritionist, ProxyMessage, ProxyMessengerFilter, RegisterUserDto } from '@backend-evolved/shared';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy
    ) { }

    @Get('health')
    getHealthCheck() {
        return { active: true };
    }

    @Post('login')
    @UseFilters(ControllerExceptionFilter)
    async login(@Body('email') email: string, @Body('password') password: string) {
        const result = await firstValueFrom(
            this.authServiceProxy.send<ProxyMessage<LoginTokenResponse>, LoginUserDto>('admin.login', { email, password })
        );
        if (result && "error" in result) throw new RpcException(result);
        return result;
    }

    @Post('approve-nutritionist')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async approveNutritionist(@Body('email') email: string) {
        const result = await firstValueFrom(
            this.authServiceProxy.send<ProxyMessage<Nutritionist>, string>('nutritionist.approval', email)
        );
        if (result && "error" in result) throw new RpcException(result);
        return result.payload;
    }


    @Post('create-admin')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async createAdmin(@Headers() headers: any, @Body() adminData: Partial<RegisterUserDto>) {
        const admin = await this.adminService.findOneById(headers['user-id'], ['adminManagementLevel']);
        if (admin && !admin.adminManagementLevel.canCreateAdmin) {
            throw new ForbiddenException("You do not have permission to perform this action");
        }
        return await this.adminService.createOne(adminData);
    }

}
