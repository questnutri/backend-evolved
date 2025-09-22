import { provideTypeOrmDbConnection, RefreshToken, User } from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    process.env.DEV_AUTH_SERVICE_DATABASE_PORT || '5432',
    process.env.DEV_AUTH_SERVICE_DATABASE_HOST || 'auth-postgres-service',
    [User, RefreshToken],
    false
)