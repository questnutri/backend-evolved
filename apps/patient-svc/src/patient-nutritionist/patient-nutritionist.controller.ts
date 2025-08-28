import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { PatientNutritionistService } from './patient-nutritionist.service';
import { type FindAllFromNutritionistPayload, ProxyMessage, Patient, ProxyMessengerFilter, PatientNutritionist, messageRegistry } from '@backend-evolved/shared';

@Controller('patient')
export class PatientNutritionistController {
    constructor(private readonly patientNutritionistService: PatientNutritionistService) { }

    @MessagePattern(messageRegistry.patient.findAllFromNutritionist.cmd)
    @UseFilters(ProxyMessengerFilter)
    async findAllPatients(@Payload() data: FindAllFromNutritionistPayload): Promise<ProxyMessage<Patient[]>> {
        const patientNutritionistArray = await this.patientNutritionistService.findAll({ nutritionistId: data.nutritionistId });
        const patients = patientNutritionistArray.map(pn => pn.patient);
        return { payload: patients };
    }

    @MessagePattern('patient.isRelatedToNutritionist')
    @UseFilters(ProxyMessengerFilter)
    async isPatientRelated(patientId: string, nutritionistId: string): Promise<ProxyMessage<boolean>> {
        return { payload: (await this.patientNutritionistService.findOne({ patientId, nutritionistId })) !== null };
    }
}
