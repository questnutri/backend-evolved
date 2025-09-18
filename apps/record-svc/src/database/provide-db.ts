import { MealRecord, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.RECORD_SERVICE_DATABASE_PORT || '5437',
    process.env.RECORD_SERVICE_DATABASE_HOST || 'localhost',
    [MealRecord],
)
