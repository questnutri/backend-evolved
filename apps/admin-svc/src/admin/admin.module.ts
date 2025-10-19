import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AUTH_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';
import { NutritionistModule } from './nutritionist/nutritionist.module';
import { StaffModule } from './staff/staff.module';
import { PermissionService } from '../permission/permission.service';

@Module({
    imports: [
        dbConnection(),
        NutritionistModule,
        StaffModule
    ],
    controllers: [AdminController],
    providers: [
        AdminService,
        PermissionService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME)
    ],
})
export class AdminModule { }
