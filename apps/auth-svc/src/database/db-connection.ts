import { provideTypeOrmDbConnection, RefreshToken, User } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        port: process.env.DEV_AUTH_SERVICE_DATABASE_PORT,
        host: process.env.DEV_AUTH_SERVICE_DATABASE_HOST || 'auth-postgres-service',
        entities: [User, RefreshToken],
        synchronize: false
    }
)