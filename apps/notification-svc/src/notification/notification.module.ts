import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRestController } from './controllers/notification-rest.controller';
import { NotificationProxyController } from './controllers/notification-proxy.controller';
import { dbConnection } from '../database/db-connection';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [
        NotificationRestController,
        NotificationProxyController,
    ],
    providers: [NotificationService],
})
export class NotificationModule {}