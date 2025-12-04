import { Module } from '@nestjs/common';
import { dbConnection } from '../../database/db-connection';
import { PermissionService } from '../../permission/permission.service';
import { NotificationController } from './notification.controller';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [NotificationController],
    providers: [
        PermissionService
    ],
})
export class NutritionistModule { }
