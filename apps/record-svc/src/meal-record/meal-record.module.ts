import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealRecordService } from './meal-record.service';
import { MealRecordController } from './meal-record.controller';
import { MealRecordMessageController } from './meal-record-message.controller';
import { DIET_SERVICE_PROXY_NAME, MealRecord, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        TypeOrmModule.forFeature([MealRecord])
    ],
    controllers: [MealRecordController, MealRecordMessageController],
    providers: [MealRecordService,
        provideProxyService(DIET_SERVICE_PROXY_NAME)
    ],
    exports: [MealRecordService]
})
export class MealRecordModule { }
