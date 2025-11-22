import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AUTH_SERVICE_PROXY_NAME, NUTRITIONIST_SERVICE_PROXY_NAME, PATIENT_SERVICE_PROXY_NAME, provideProxyService } from '@backend-evolved/shared';
import { dbConnection } from '../database/db-connection';
import { NutritionistModule } from './nutritionist/nutritionist.module';
import { StaffModule } from './staff/staff.module';
import { PermissionService } from '../permission/permission.service';
import { DietModule } from './diet/diet.module';
import { PatientModule } from './patient/admin-patient.module';

@Module({
    imports: [
        dbConnection(),
        NutritionistModule,
        StaffModule,
        DietModule,
        PatientModule
    ],
    controllers: [AdminController],
    providers: [
        AdminService,
        PermissionService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(NUTRITIONIST_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
})
export class AdminModule { }
