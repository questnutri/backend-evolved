import { Body, Controller, Inject, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    AUTH_SERVICE_PROXY_NAME,
    AdminManagementLevel,
    ControllerExceptionFilter,
    JwtRoleGuard,
    emitProxyMessage,
    proxyPattern
} from '@backend-evolved/shared';
import { ManagementGuard } from '../../guards/management.guard';

@Controller('notifications')
export class NotificationController {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly notificationProxy: ClientProxy,
    ) { }

    @Post()
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(AdminManagementLevel, "canCreateNotifications")
    )
    @UseFilters(ControllerExceptionFilter)
    async createNotification(
        @Body() data: typeof proxyPattern.notification.create.payload
    ) {
        emitProxyMessage<
            typeof proxyPattern.notification.create.payload
        >({
            proxy: this.notificationProxy,
            pattern: proxyPattern.notification.create.key,
            data
        });
    }
}