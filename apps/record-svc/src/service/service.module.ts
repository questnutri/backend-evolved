import { Module } from '@nestjs/common';
import { MealRecordModule } from '../meal-record/meal-record.module';
import { dbConnection } from '../database/db-connection';
import { AppModule } from '../app/app.module';

@Module({
    imports: [
        dbConnection(),
        MealRecordModule,
        AppModule,
    ],
    controllers: [],
    providers: [],
})
export class ServiceModule { }
