import { Body, Controller, Inject, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    AdminManagementLevel,
    ControllerExceptionFilter,
    JwtRoleGuard,
    NOTIFICATION_SERVICE_PROXY_NAME,
    emitProxyMessage,
    proxyPattern
} from '@backend-evolved/shared';
import { ManagementGuard } from '../../guards/management.guard';

@Controller('notifications')
export class NotificationController {
    constructor(
        @Inject(NOTIFICATION_SERVICE_PROXY_NAME) private readonly notificationProxy: ClientProxy,
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
        console.log("[admin-svc] Sending notification");
        emitProxyMessage<
            typeof proxyPattern.notification.create.payload
        >({
            proxy: this.notificationProxy,
            pattern: proxyPattern.notification.create.key,
            data,
            options: {
                retry: {
                    count: 3, delay: 50
                }
            }
        });
    }
}