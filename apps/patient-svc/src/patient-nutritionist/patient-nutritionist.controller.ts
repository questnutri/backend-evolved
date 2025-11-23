import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PatientNutritionistService } from './patient-nutritionist.service';
import { ProxyMessage, ProxyMessengerFilter, proxyPattern, removePropertiesForMany } from '@backend-evolved/shared';

@Controller()
export class PatientNutritionistController {
    constructor(private readonly patientNutritionistService: PatientNutritionistService) { }

    @MessagePattern(proxyPattern.patient.findAllFromNutritionist.key)
    @UseFilters(ProxyMessengerFilter)
    async findAllPatients(
        @Payload() data: typeof proxyPattern.patient.findAllFromNutritionist.payload
    ): Promise<ProxyMessage<
        typeof proxyPattern.patient.findAllFromNutritionist.response
    >> {
        const patientNutritionistArray = await this.patientNutritionistService.findAll({
            where: { nutritionistId: data.nutritionistId },
            limit: 999
        });
        const patients = removePropertiesForMany(patientNutritionistArray.map(pn => pn.patient), ['nutritionists']);
        return { payload: patients };
    }

    @MessagePattern(proxyPattern.patient.isRelatedToNutritionist.key)
    @UseFilters(ProxyMessengerFilter)
    async isNutritionistRelated(data: typeof proxyPattern.patient.isRelatedToNutritionist.payload): 
        Promise<ProxyMessage<typeof proxyPattern.patient.isRelatedToNutritionist.response>> 
    {
        return { payload: (await this.patientNutritionistService.findOnePatient(data)) !== null };
    }
}
