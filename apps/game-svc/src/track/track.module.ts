import { Module } from '@nestjs/common';
import { dbConnection } from '../database/db-connection';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [TrackController],
    providers: [TrackService]
})
export class TrackModule {}