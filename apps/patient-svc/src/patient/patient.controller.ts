import { Controller, UseFilters } from '@nestjs/common';
import { PatientService } from './patient.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { type FindAllFromNutritionistPayload, type CreatePatientDto, ProxyMessengerFilter, ProxyMessage, Patient } from '@backend-evolved/shared';
import { PatientNutritionistService } from './patient-nutritionist.service';

@Controller('patient')
export class PatientController {
    constructor(
        private readonly patientService: PatientService,
        private readonly patientNutritionistService: PatientNutritionistService
    ) { }

    @MessagePattern('patient.creation')
    @UseFilters(ProxyMessengerFilter)
    async createPatient(@Payload() data: CreatePatientDto): Promise<ProxyMessage<Patient>> {
        return { payload: await this.patientService.createOne(data) };
    }

    // @MessagePattern('patient.findAllFromNutritionist')
    // @UseFilters(ProxyMessengerFilter)
    // async findAllPatients(@Payload() data: FindAllFromNutritionistPayload): Promise<ProxyMessage<Patient[]>> {
    //     return { payload: await this.patientService.findAllFromNutritionist(data.nutritionistId) };
    // }

    @MessagePattern('patient.isNutritionistRelated')
    @UseFilters(ProxyMessengerFilter)
    async isPatientRelated(patientId: string, nutritionistId: string): Promise<boolean> {
        try {
            return await this.patientNutritionistService.isNutritionistRelated(patientId, nutritionistId);
        } catch (err: any) {
            throw new RpcException({
                detail: err?.message ?? String(err),
                source: err.constructor.name
            });
        }
    }



}
