import { Module } from '@nestjs/common';
import { dbConnection } from '../database/db-connection';
import { ListenerController } from './listener.controller';
import { ListenerService } from './listener.service';
import { TrackService } from '../track/track.service';
import { AchievementService } from '../achievement/achievement.service';
import {
    NOTIFICATION_SERVICE_PROXY_NAME,
    provideProxyService
} from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        ListenerController
    ],
    providers: [
        ListenerService,
        TrackService,
        AchievementService,
        provideProxyService(NOTIFICATION_SERVICE_PROXY_NAME)
    ]
})
export class ListenerModule {}
