import { Module } from '@nestjs/common';
import { PatientModule } from '../patient/patient.module';
import { PatientNutritionistModule } from '../patient-nutritionist/patient-nutritionist.module';

@Module({
    imports: [
        PatientModule,
        PatientNutritionistModule
    ],
    controllers: [],
    providers: [],
})
export class ServiceModule { }
