import { Controller, UseFilters } from '@nestjs/common';
import { PatientService } from '../patient.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
    ProxyMessengerFilter,
    ProxyMessage, proxyPattern
} from '@backend-evolved/shared';
import { PatientNutritionistService } from '../../patient-nutritionist/patient-nutritionist.service';

@Controller()
export class PatientProxyController {
    constructor(
        private readonly patientService: PatientService,
        private readonly patientNutritionistService: PatientNutritionistService,
    ) { }

    @MessagePattern(proxyPattern.patient.creation.key)
    @UseFilters(ProxyMessengerFilter)
    async createPatient(
        @Payload() data: typeof proxyPattern.patient.creation.payload
    ): Promise<ProxyMessage<typeof proxyPattern.patient.creation.response>> {
        return { payload: await this.patientService.createOne(data as any) };
    }

    @MessagePattern(proxyPattern.patient.getAll.key)
    @UseFilters(ProxyMessengerFilter)
    async getAll(
        @Payload() payload: typeof proxyPattern.patient.getAll.payload
    ): Promise<ProxyMessage<typeof proxyPattern.patient.getAll.response>> {
        const { where } = payload;
        let patientRelations = await this.patientNutritionistService.findAll({ where });
        if (patientRelations.length === 0) return { payload: [] };
        let patientIds = new Set<string>();
        patientRelations.forEach(relation => {
            patientIds.add(relation.patientId);
        });
        const patientsList = await this.patientService.findManyByIds(
            Array.from(patientIds),
            payload.ctxUser,
        );

        return {
            payload: patientsList.items
        };
    }

    @MessagePattern(proxyPattern.patient.getById.key)
    @UseFilters(ProxyMessengerFilter)
    async getById(
        @Payload() payload: typeof proxyPattern.patient.getById.payload
    ): Promise<ProxyMessage<typeof proxyPattern.patient.getById.response>> {
        return {
            payload: await this.patientService.findOne(
                payload.ctxUser,
                {
                    ...payload.options,
                    where: { id: payload.id },
                })
        };
    }

    @MessagePattern(proxyPattern.patient.softDeletionById.key)
    @UseFilters(ProxyMessengerFilter)
    async handleSoftDeletionById(
        @Payload() payload: typeof proxyPattern.patient.softDeletionById.payload
    ): Promise<ProxyMessage<typeof proxyPattern.patient.softDeletionById.response>> {
        // const result = await this.patientService.softDeleteById(payload.id);
        // return { payload: result };
        return { payload: true };
    }
}