import { Module } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import { NutritionistController } from './nutritionist.controller';
import { AUTH_SERVICE_PROXY_NAME, Nutritionist, PATIENT_SERVICE_PROXY_NAME, provideProxyService, provideTypeOrmDbConnection } from '@backend-evolved/shared';


@Module({
    imports: [
        provideTypeOrmDbConnection(
            process.env.NUTRITIONIST_SERVICE_DATABASE_PORT || '5433',
            process.env.NUTRITIONIST_SERVICE_DATABASE_HOST || 'localhost',
            [Nutritionist]
        ),
    ],
    controllers: [
        NutritionistController
    ],
    providers: [
        NutritionistService,
        provideProxyService(AUTH_SERVICE_PROXY_NAME),
        provideProxyService(PATIENT_SERVICE_PROXY_NAME)
    ],
})
export class NutritionistModule { }
