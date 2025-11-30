import { 
    NotificationEntity,
    provideTypeOrmDbConnection
} from "@backend-evolved/shared";

export const dbConnection = () => provideTypeOrmDbConnection(
    {
        host: process.env.DEV_NOTIFICATION_SERVICE_DATABASE_HOST || 'notification-postgres-service',
        port: process.env.DEV_NOTIFICATION_SERVICE_DATABASE_PORT,
        entities: [
            NotificationEntity
        ],
        synchronize: true
    }
);