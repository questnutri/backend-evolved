import { HomeMeasureAliment, provideTypeOrmDbConnection, SecretAliment, TacoAliment } from "@backend-evolved/shared";

export const dbConnection = () =>  provideTypeOrmDbConnection(
    process.env.ALIMENT_SERVICE_DATABASE_PORT || '27017',
    process.env.ALIMENT_SERVICE_DATABASE_HOST || 'aliment-mongodb-service',
    [TacoAliment, HomeMeasureAliment, SecretAliment],
    true,
    'mongodb'
)