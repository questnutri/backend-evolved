import { Diet, Food, Meal, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () =>  provideTypeOrmDbConnection(
    process.env.DIET_SERVICE_DATABASE_PORT || '5435',
    [Diet, Meal, Food],
)