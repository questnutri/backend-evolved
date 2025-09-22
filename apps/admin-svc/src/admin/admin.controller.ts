import { Controller, Body, Post, Inject, UseGuards, UseFilters, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AUTH_SERVICE_PROXY_NAME, ControllerExceptionFilter, JwtRoleGuard, Nutritionist, ProxyMessage } from '@backend-evolved/shared';
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
}
