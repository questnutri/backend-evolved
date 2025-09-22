import { Nutritionist, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.DEV_NUTRITIONIST_SERVICE_DATABASE_PORT || '5432',
    process.env.DEV_NUTRITIONIST_SERVICE_DATABASE_HOST || 'nutritionist-postgres-service',
    [Nutritionist]
)