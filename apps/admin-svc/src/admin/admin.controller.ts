import { Controller, Body, Post, Inject, UseGuards, UseFilters, Get, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { 
    AUTH_SERVICE_PROXY_NAME,
    ControllerExceptionFilter,
    JwtRoleGuard,
    LoginResponse,
    LoginUserDto,
    ContextUser,
    sendProxyMessage
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
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
        return sendProxyMessage<LoginResponse, LoginUserDto>({
            proxy: this.authServiceProxy,
            pattern: 'admin.login',
            data: { email, password },
            options: {
                retry: {
                    count: 2, delay: 50
                }
            }
        });
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(@ContextUser() user: ContextUser) {
        const admin = await this.adminService.findOneById(user.id, user.id, { adaptManagementView: false });
        if (!admin) throw new NotFoundException("Admin not found");
        return admin;
    }

}
