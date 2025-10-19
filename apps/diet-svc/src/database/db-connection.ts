import { Diet, Food, Meal, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () =>  provideTypeOrmDbConnection(
    {
        port: process.env.DEV_DIET_SERVICE_DATABASE_PORT,
        host: process.env.DEV_DIET_SERVICE_DATABASE_HOST || 'diet-postgres-service',
        entities: [Diet, Meal, Food],
    }
)