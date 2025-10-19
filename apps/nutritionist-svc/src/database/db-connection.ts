import { Nutritionist, provideTypeOrmDbConnection } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        port: process.env.DEV_NUTRITIONIST_SERVICE_DATABASE_PORT,
        host: process.env.DEV_NUTRITIONIST_SERVICE_DATABASE_HOST || 'nutritionist-postgres-service',
        entities: [Nutritionist],
    }
)