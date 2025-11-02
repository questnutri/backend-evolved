import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PatientNutritionistService } from './patient-nutritionist.service';
import { ProxyMessage, Patient, ProxyMessengerFilter, proxyPattern } from '@backend-evolved/shared';

@Controller()
export class PatientNutritionistController {
    constructor(private readonly patientNutritionistService: PatientNutritionistService) { }

    @MessagePattern(proxyPattern.patient.findAllFromNutritionist)
    @UseFilters(ProxyMessengerFilter)
    async findAllPatients(@Payload() data: { nutritionistId: string }): Promise<ProxyMessage<Patient[]>> {
        const patientNutritionistArray = await this.patientNutritionistService.findAll({ ...data });
        const patients = patientNutritionistArray.map(pn => pn.patient);
        return { payload: patients };
    }

    @MessagePattern(proxyPattern.patient.isRelatedToNutritionist)
    @UseFilters(ProxyMessengerFilter)
    async isNutritionistRelated(data: { patientId: string, nutritionistId: string }): Promise<ProxyMessage<boolean>> {
        return { payload: (await this.patientNutritionistService.findOneWhere(data)) !== null };
    }
}
