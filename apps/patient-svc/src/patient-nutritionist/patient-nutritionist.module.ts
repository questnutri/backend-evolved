import { Module } from '@nestjs/common';
import { PatientNutritionistService } from './patient-nutritionist.service';
import { PatientNutritionistController } from './patient-nutritionist.controller';
import { dbConnection } from '../database/provide-db';

@Module({
    imports: [
        dbConnection()
    ],
    controllers: [PatientNutritionistController],
    providers: [PatientNutritionistService],
})
export class PatientNutritionistModule { }
