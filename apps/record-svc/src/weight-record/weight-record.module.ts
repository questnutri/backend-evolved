import { Module } from '@nestjs/common';
import { WeightRecordService } from './weight-record.service';
import { WeightRecordRestController } from './controllers/weight-record-rest.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    NUTRITIONIST_SERVICE_PROXY_NAME,
    PATIENT_SERVICE_PROXY_NAME,
    provideProxyService,
    WeightRecord
} from '@backend-evolved/shared';
import { WeightRecordProxyController } from './controllers/weight-record-proxy.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([WeightRecord])
    ],
    controllers: [
        WeightRecordRestController,
        WeightRecordProxyController
    ],
    providers: [
        WeightRecordService,
        provideProxyService(PATIENT_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME)
    ],
})
export class WeightRecordModule { }