import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListenerModule } from '../listener/listener.module';
import { dbConnection } from '../database/db-connection';
import { TrackModule } from '../track/track.module';
import { TriggerModule } from '../trigger/trigger.module';

@Module({
    imports: [
        dbConnection(),
        ListenerModule,
        TrackModule,
        TriggerModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
