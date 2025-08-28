import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { DietModule } from '../diet/diet.module';
import { MealModule } from '../meal/meal.module';
import { FoodModule } from '../food/food.module';
import { DietResolver } from './diet.resolver';
import { MealResolver } from './meal.resolver';
import { FoodResolver } from './food.resolver';
import { dbConnection } from '../database/provide-db';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            playground: true,
            path: '/graphql',
            context: ({ req }: any) => ({ req }),
        }),
        dbConnection(),
        DietModule,
        MealModule,
        FoodModule,
    ],
    providers: [DietResolver, MealResolver, FoodResolver],
    exports: [DietResolver, MealResolver, FoodResolver],
})
export class GraphqlModule { }
