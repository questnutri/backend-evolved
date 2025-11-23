import { Module } from '@nestjs/common';
import { NutritionistModule } from './nutritionist/nutritionist.module';
import { AddressModule } from './address/address.module';

@Module({
    imports: [
        NutritionistModule,
        AddressModule
    ],
    controllers: [],
    providers: [],
})
export class NutritionistServiceModule {}