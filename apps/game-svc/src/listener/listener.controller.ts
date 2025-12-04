import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import {
    ControllerExceptionFilter,
    emitProxyMessage,
    errorMessagePattern,
    EventOrigin,
    JwtRoleGuard,
    ListenerEntity,
    ListenerIncludeOptions,
    NOTIFICATION_SERVICE_PROXY_NAME,
    NotificationMessage,
    NotificationType,
    PaginationQuery,
    PropertyType,
    proxyPattern
} from '@backend-evolved/shared';
import { ListenerService } from './listener.service';
import { TrackService } from '../track/track.service';
import { AchievementService } from '../achievement/achievement.service';

@Controller('listeners')
export class ListenerController {
    constructor(
        private readonly listenerService: ListenerService,
        private readonly trackService: TrackService,
        private readonly achievementService: AchievementService,
        @Inject(NOTIFICATION_SERVICE_PROXY_NAME)
        private readonly notificationServiceProxy: ClientProxy,
    ) { }

    @MessagePattern(proxyPattern.log.message.key)
    async listenToControllers(@Payload() log: any): Promise<void> {
        // console.log(log);
        if (!log.user) return;
        if (log.origin === EventOrigin.CONTROLLER) {
            const foundListeners = await this.listenerService.find({
                where: {
                    origin: EventOrigin.CONTROLLER,
                    controller: log.controller,
                    method: log.method,
                    handler: log.handler,
                },
                includeTriggers: true
            });
            // console.log("Found listener for call", foundListeners);
            for (const listener of foundListeners) {
                for (const trigger of listener.triggers) {
                    const { track } = trigger;
                    const userId = log.user.id;
                    const trackRecord = await this.trackService.findOneRecord({
                        trackId: track.id,
                        userId
                    });
                    console.log(track);
                    console.log(trackRecord);
                    const mustTrigger = trigger.test(trackRecord, log);
                    if (mustTrigger) {
                        console.log("triggering", trigger);
                        const updatedRecord = await this.trackService.updateOrCreate(
                            trackRecord!,
                            track,
                            log
                        );
                        for (const achievementTemplate of track.achievements) {
                            const foundAchievement = await this.achievementService.foundRecord({
                                where: {
                                    userId,
                                    achievementId: achievementTemplate.id
                                }
                            });
                            if (foundAchievement) {
                                console.log(`[Game-svc] Found an achievement record for user ${userId} and achievement ${achievementTemplate.id}, skipping...`);
                                continue;
                            };
                            if (track.configuration.trackPropertyType === PropertyType.NUMBER) {
                                if (Number(updatedRecord.currentValue) >= Number(achievementTemplate.targetValue)) {
                                    await this.achievementService.createRecord({
                                        userId,
                                        achievementId: achievementTemplate.id
                                    });
                                    const notificationsI18n = Object.entries(achievementTemplate.i18n).reduce((acc, [lang, info]) => {
                                        acc[lang] = { ...info.unlockNotification };
                                        return acc;
                                    }, {} as Record<string, NotificationMessage>);

                                    emitProxyMessage<typeof proxyPattern.notification.create.payload>({
                                        proxy: this.notificationServiceProxy,
                                        pattern: proxyPattern.notification.create.key,
                                        data: {
                                            userId,
                                            type: NotificationType.ACHIEVEMENT,
                                            i18n: notificationsI18n
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        } else {
            console.log(`[Game-svc] Log is not controller origin`);
        }
    }

    @Get('all')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async getAll(
        @Query() query:
            PaginationQuery & ListenerIncludeOptions
    ) {
        return await this.listenerService.find({});
    }

    @Get(':id')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async getOne(
        @Param('id') id: string,
        @Query() query: Partial<ListenerIncludeOptions>,
    ) {
        return await this.listenerService.findOne({ ...query, where: { id } });
    }

    @Post()
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async createListener(
        @Body() listenerEntity: Partial<ListenerEntity>
    ) {
        return await this.listenerService.create(listenerEntity);
    }

    @Delete(':id')
    @HttpCode(204)
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async deleteListener(
        @Param('id') id: string
    ) {
        const foundListener = await this.listenerService.findOne({ where: { id }, includeTriggers: true });
        if (foundListener.triggers.length > 0) {
            throw new BadRequestException(errorMessagePattern.game.listener.listenerHasTriggersAttached.fn());
        }
        return await this.listenerService.delete(foundListener);
    }
}