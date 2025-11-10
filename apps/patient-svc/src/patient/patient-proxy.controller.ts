import { Controller, UseFilters } from '@nestjs/common';
import { PatientService, TreatedPatient } from './patient.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProxyMessengerFilter, ProxyMessage, Patient, proxyPattern, BodyCreatePatientDto, ContextLog } from '@backend-evolved/shared';

@Controller()
export class PatientProxyController {
    constructor(
        private readonly patientService: PatientService,
    ) { }

    @MessagePattern(proxyPattern.patient.creation)
    @UseFilters(ProxyMessengerFilter)
    async createPatient(
        @Payload() data: BodyCreatePatientDto,
        @ContextLog() contextLog: ContextLog
    ): Promise<ProxyMessage<Patient>> {
        console.log("[PatientProxyController] Creating patient with context log id:", contextLog.id);
        return { payload: await this.patientService.createOne(data, contextLog) };
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