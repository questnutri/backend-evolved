import { Body, Controller, Get, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import {
    ContextUser,
    ControllerExceptionFilter,
    JwtRoleGuard,
    NotificationType
} from '@backend-evolved/shared';

@Controller()
export class NotificationRestController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get('health')
    @ApiExcludeEndpoint()
    healthCheck() {
        return { active: true };
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['patient', 'nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async getAllNotificationsForMe(
        @ContextUser() user: ContextUser,
        @Query('type') type?: NotificationType
    ) {
        let where: any = {
            userId: user.id
        }
        if (type) {
            where.type = type;
        }
        return await this.notificationService.findAll({
            where
        });
    }

    @Get('me/all')
    @UseGuards(JwtRoleGuard(['patient', 'nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async getAllNotificationsForMeNoAck(
        @ContextUser() user: ContextUser,
        @Query('type') type?: NotificationType
    ) {
        let where: any = {
            userId: user.id,
        }
        if (type) {
            where.type = type;
        }
        return await this.notificationService.findAll({
            where,
            withDeleted: true
        });
    }

    @Post('ack')
    @UseGuards(JwtRoleGuard(['patient', 'nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async ackNotifications(
        @ContextUser() user: ContextUser,
        @Body() body: { ids: string[] }
    ) {
        return await this.notificationService.deleteManyByIds(body.ids);
    }

    @Post('ack/all')
    @UseGuards(JwtRoleGuard(['patient', 'nutritionist', 'admin']))
    @UseFilters(ControllerExceptionFilter)
    async ackAllNotifications(
        @ContextUser() user: ContextUser,
        @Query('type') type?: NotificationType
    ) {
        let where: any = {
            userId: user.id
        }
        if( type ) {
            where.type = type;
        }
        const notifications = await this.notificationService.findAll({
            where
        });
        return await this.notificationService.remove(notifications);
    }
}