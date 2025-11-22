import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealRecordService } from './meal-record.service';
import {
    MealRecordProxyController
} from './controllers/meal-record-proxy.controller';
import { DIET_SERVICE_PROXY_NAME, MealRecord, provideProxyService } from '@backend-evolved/shared';
import { MealRecordRestController } from './controllers/meal-record-rest.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([MealRecord])
    ],
    controllers: [
        MealRecordRestController,
        MealRecordProxyController
    ],
    providers: [MealRecordService,
        provideProxyService(DIET_SERVICE_PROXY_NAME)
    ],
    exports: [MealRecordService]
})
export class MealRecordModule { }
