import { Controller, Body, Post, Inject, ConflictException, InternalServerErrorException, NotFoundException, UseGuards, UseFilters } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AUTH_SERVICE_PROXY_NAME, ControllerExceptionFilter, Nutritionist, ProxyMessage, RoleGuard } from '@backend-evolved/shared';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy
    ) { }

    @Post('approve-nutritionist')
    @UseGuards(RoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async approveNutritionist(@Body('email') email: string) {
        const result = await firstValueFrom(
            this.authServiceProxy.send<ProxyMessage<Nutritionist>, string>('nutritionist.approval', email)
        );
        if (result && "error" in result) throw new RpcException(result);
        return result.payload;
    }
}
