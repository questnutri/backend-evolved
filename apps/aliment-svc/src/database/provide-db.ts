import { provideTypeOrmDbConnection, TacoAliment } from "@backend-evolved/shared";

export const dbConnection = () =>  provideTypeOrmDbConnection(
    process.env.ALIMENT_SERVICE_DATABASE_PORT || '27036',
    [TacoAliment],
    true,
    'mongodb'
)