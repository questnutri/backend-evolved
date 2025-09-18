import { Module } from '@nestjs/common';
import { MealRecordModule } from '../meal-record/meal-record.module';
import { dbConnection } from '../database/provide-db';

@Module({
    imports: [
        dbConnection(),
        MealRecordModule
    ],
    controllers: [],
    providers: [],
})
export class ServiceModule { }
