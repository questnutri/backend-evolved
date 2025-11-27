import { Module } from '@nestjs/common';
import { dbConnection } from '../database/db-connection';
import { ListenerController } from './listener.controller';
import { ListenerService } from './listener.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [ListenerController],
    providers: [ListenerService]
})
export class ListenerModule {}
