import { Controller } from '@nestjs/common';
import { PatientService } from './patient.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type FindAllFromNutritionistPayload, type CreatePatientDto } from '@backend-evolved/shared';

@Controller('patient')
export class PatientController {
    constructor(private readonly patientService: PatientService) {}

    @MessagePattern('patient.creation')
    async createPatient(@Payload() data: CreatePatientDto) {
        return await this.patientService.create(data);
    }

    @MessagePattern('patient.findAllFromNutritionist')
    async findAllPatients(@Payload() data: FindAllFromNutritionistPayload) {
        return await this.patientService.findAllFromNutritionist(data.nutritionistId);
    }

}
