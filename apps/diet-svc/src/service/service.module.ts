import { Module } from '@nestjs/common';
import { DietModule } from '../diet/diet.module';
import { MealModule } from '../meal/meal.module';
import { FoodModule } from '../food/food.module';
import { GraphqlModule } from '../graphql/graphql.module';
import { PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';

@Module({
    imports: [
        DietModule,
        MealModule,
        FoodModule,
        GraphqlModule
    ],
    controllers: [],
    providers: [
    ],
})
export class ServiceModule { }
