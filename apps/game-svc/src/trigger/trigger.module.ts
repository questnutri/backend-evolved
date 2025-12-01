import { Module } from '@nestjs/common';
import { TriggerService } from './trigger.service';
import { TriggerController } from './trigger.controller';
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
