import { Controller, UseFilters } from '@nestjs/common';
import { PatientService, TreatedPatient } from './patient.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProxyMessengerFilter, ProxyMessage, Patient, proxyPattern, BodyCreatePatientDto } from '@backend-evolved/shared';

@Controller()
export class PatientProxyController {
    constructor(
        private readonly patientService: PatientService,
    ) { }

    @MessagePattern(proxyPattern.patient.creation)
    @UseFilters(ProxyMessengerFilter)
    async createPatient(@Payload() data: BodyCreatePatientDto): Promise<ProxyMessage<Patient>> {
        return { payload: await this.patientService.createOne(data) };
    }

    @MessagePattern(proxyPattern.patient.getAll)
    @UseFilters(ProxyMessengerFilter)
    async getAll(): Promise<ProxyMessage<Patient[]>> {
        return { payload: await this.patientService.findAll() };
    }

    @MessagePattern(proxyPattern.patient.getById)
    @UseFilters(ProxyMessengerFilter)
    async getById(@Payload() data: { id: string }): Promise<ProxyMessage<TreatedPatient>> {
        return { payload: await this.patientService.findOneWhere({id: data.id}) };
    }

}