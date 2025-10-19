import { HomeMeasureAliment, provideTypeOrmDbConnection, SecretAliment, TacoAliment } from "@backend-evolved/shared";

export const dbConnection = () =>  provideTypeOrmDbConnection(
    {
        port: process.env.DEV_ALIMENT_SERVICE_DATABASE_PORT || '27017',
        host: process.env.DEV_ALIMENT_SERVICE_DATABASE_HOST || 'aliment-mongodb-service',
        entities: [TacoAliment, HomeMeasureAliment, SecretAliment],
        synchronize: true,
        driver: 'mongodb'
    }
)