import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import {
    ContextUser,
    ControllerExceptionFilter,
    JwtRoleGuard
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
        @ContextUser() user: ContextUser
    ) {
        return await this.notificationService.findAll({
            where: {
                userId: user.id
            }
        });
    }

}