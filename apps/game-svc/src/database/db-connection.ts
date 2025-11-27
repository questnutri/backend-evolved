import { 
    ListenerEntity,
    provideTypeOrmDbConnection
} from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        host: process.env.DEV_GAME_SERVICE_DATABASE_HOST || 'game-postgres-service',
        port: process.env.DEV_GAME_SERVICE_DATABASE_PORT,
        entities: [
            ListenerEntity
        ],
        synchronize: true
    }
);