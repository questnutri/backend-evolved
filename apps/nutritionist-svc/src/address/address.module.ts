import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { dbConnection } from '../database/db-connection';
import { NutritionistService } from '../nutritionist/nutritionist.service';
import {
    AUTH_SERVICE_PROXY_NAME,
    PATIENT_SERVICE_PROXY_NAME,
    provideProxyService
} from '@backend-evolved/shared';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [AddressController],
    providers: [
        AddressService,
        NutritionistService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
})
export class AddressModule { }
