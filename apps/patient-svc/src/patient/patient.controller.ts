import { Controller, Get, UseFilters } from '@nestjs/common';
import { PatientService } from './patient.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { type FindAllFromNutritionistPayload, type CreatePatientDto, ProxyMessengerFilter, ProxyMessage, Patient } from '@backend-evolved/shared';

@Controller('patient')
export class PatientController {
    constructor(
        private readonly patientService: PatientService,
    ) { }

    @MessagePattern('patient.creation')
    @UseFilters(ProxyMessengerFilter)
    async createPatient(@Payload() data: CreatePatientDto): Promise<ProxyMessage<Patient>> {
        return { payload: await this.patientService.createOne(data) };
    }

    @Get('health')
    healthCheck() {
        return { active: true };
    }

}