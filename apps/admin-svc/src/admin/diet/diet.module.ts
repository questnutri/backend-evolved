import { Module } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietController } from './diet.controller';
import { dbConnection } from '../../database/db-connection';
import { DIET_SERVICE_PROXY_NAME, provideProxyService } from '../../../../../libs/shared/src/providers';
import { PermissionService } from '../../permission/permission.service';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [DietController],
    providers: [
        DietService,
        provideProxyService(DIET_SERVICE_PROXY_NAME),
        PermissionService
    ],
})
export class DietModule { }
