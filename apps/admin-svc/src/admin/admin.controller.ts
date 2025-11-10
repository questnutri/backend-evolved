import { Controller, Body, Post, Inject, UseGuards, UseFilters, Get, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
    AUTH_SERVICE_PROXY_NAME,
    ControllerExceptionFilter,
    JwtRoleGuard,
    LoginResponse,
    LoginUserDto,
    ContextUser,
    sendProxyMessage,
    User,
    proxyPattern
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';
import { Admin } from 'typeorm';

@Controller()
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authProxy: ClientProxy
    ) { }

    @Get('health')
    getHealthCheck() {
        return { active: true };
    }

    @Post('login')
    @UseFilters(ControllerExceptionFilter)
    async login(@Body('email') email: string, @Body('password') password: string) {
        return await sendProxyMessage<LoginResponse, LoginUserDto>({
            proxy: this.authProxy,
            pattern: proxyPattern.admin.login,
            data: { email, password },
            options: {
                retry: {
                    count: 10, delay: 50
                }
            },
        });
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async getMe(@ContextUser() user: ContextUser): Promise<Partial<Admin> & Partial<User>> {
        const admin = await this.adminService.findOneById(user.id, user.id, { adaptManagementView: false });
        if (!admin) throw new NotFoundException("Admin not found");
        const userAdmin = await sendProxyMessage<User>({
            proxy: this.authProxy,
            pattern: proxyPattern.user.getOneById,
            data: { id: admin.id },
            options: {
                retry: {
                    count: 2, delay: 50
                }
            }
        });
        return {
            ...userAdmin,
            ...admin,
        };
    }

}