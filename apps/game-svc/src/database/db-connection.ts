import { 
    ListenerEntity,
    provideTypeOrmDbConnection,
    TrackEntity,
    TrackRecord,
    TriggerEntity
} from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        host: process.env.DEV_GAME_SERVICE_DATABASE_HOST || 'game-postgres-service',
        port: process.env.DEV_GAME_SERVICE_DATABASE_PORT,
        entities: [
            ListenerEntity,
            TrackEntity,
            TrackRecord,
            TriggerEntity,
        ],
        synchronize: true
    }
);