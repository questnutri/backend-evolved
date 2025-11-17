import { Module } from '@nestjs/common';
import { MealRecordModule } from '../meal-record/meal-record.module';
import { dbConnection } from '../database/db-connection';
import { AppModule } from '../app/app.module';
import { WaterRecordModule } from '../water-record/water-record.module';

@Module({
    imports: [
        dbConnection(),
        MealRecordModule,
        WaterRecordModule,
        AppModule,
    ],
    controllers: [],
    providers: [],
})
export class ServiceModule { }
