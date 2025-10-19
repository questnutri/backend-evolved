import { MealRecord, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        port: process.env.DEV_RECORD_SERVICE_DATABASE_PORT,
        host: process.env.DEV_RECORD_SERVICE_DATABASE_HOST || 'record-postgres-service',
        entities: [MealRecord],
    }
)
