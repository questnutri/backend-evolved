import { Module } from '@nestjs/common';
import { dbConnection } from '../database/db-connection';
import { TrackController } from './track.controller';
import { TrackTemplateService } from './track-template.service';
import { TrackService } from './track.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [TrackController],
    providers: [
        TrackTemplateService,
        TrackService
    ]
})
export class TrackModule {}