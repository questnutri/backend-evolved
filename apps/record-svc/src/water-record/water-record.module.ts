import { Module } from '@nestjs/common';
import { WaterRecordService } from './water-record.service';
import { WaterRecordController } from './water-record.controller';
import { provideProxyService, PATIENT_SERVICE_PROXY_NAME } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';

@Module({
    imports: [
        dbConnection(),
    ],
    controllers: [WaterRecordController],
    providers: [
        WaterRecordService,
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
    ],
})
export class WaterRecordModule { }
