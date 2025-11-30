import { Module } from '@nestjs/common';
import { TriggerService } from './trigger.service';
import { TriggerController } from './trigger.controller';
import { ListenerService } from '../listener/listener.service';
import { TrackTemplateService } from '../track/track-template.service';
import { dbConnection } from '../database/db-connection';

@Module({
  imports: [
    dbConnection()
  ],
  controllers: [TriggerController],
  providers: [
    TriggerService
  ],
})
export class TriggerModule {}
