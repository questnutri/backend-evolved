import { Controller, UseFilters } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProxyMessengerFilter, proxyPattern } from '@backend-evolved/shared';

@Controller()
export class NotificationProxyController {
    constructor(private readonly notificationService: NotificationService) { }

    @MessagePattern(proxyPattern.notification.create.key)
    @UseFilters(ProxyMessengerFilter)
    async handleCreateNotification(
        @Payload() payload: typeof proxyPattern.notification.create.payload
    ): Promise<typeof proxyPattern.notification.create.response> {
        console.log("Creating notification with payload:", payload);
        const createdNotification = await this.notificationService.create(payload);
        console.log(createdNotification);
    }
}