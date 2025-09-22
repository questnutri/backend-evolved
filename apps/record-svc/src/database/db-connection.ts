import { MealRecord, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.DEV_RECORD_SERVICE_DATABASE_PORT || '5432',
    process.env.DEV_RECORD_SERVICE_DATABASE_HOST || 'record-postgres-service',
    [MealRecord],
)
