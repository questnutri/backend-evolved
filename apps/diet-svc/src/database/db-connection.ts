import { Diet, Food, Meal, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () =>  provideTypeOrmDbConnection(
    process.env.DEV_DIET_SERVICE_DATABASE_PORT || '5432',
    process.env.DEV_DIET_SERVICE_DATABASE_HOST || 'diet-postgres-service',
    [Diet, Meal, Food],
)