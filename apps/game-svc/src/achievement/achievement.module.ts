import { Module } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';
import { dbConnection } from '../database/db-connection';
import { TrackService } from '../track/track.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        AchievementController
    ],
    providers: [
        AchievementService,
        TrackService
    ],
})
export class AchievementModule { }
