import { Controller, UseFilters } from '@nestjs/common';
import { PatientService } from '../patient.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
    ProxyMessengerFilter,
    ProxyMessage, proxyPattern, WaterGoal, FindCurrentWaterGoalDto
} from '@backend-evolved/shared';
import { WaterGoalService } from '../../water-goal/water-goal.service';
import { PatientNutritionistService } from '../../patient-nutritionist/patient-nutritionist.service';

@Controller()
export class PatientProxyController {
    constructor(
        private readonly patientService: PatientService,
        private readonly patientNutritionistService: PatientNutritionistService,
        private readonly waterGoalService: WaterGoalService,
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

    // @MessagePattern(proxyPattern.patient.getManyByIds.key)
    // @UseFilters(ProxyMessengerFilter)
    // async getManyByIds(
    //     @Payload() payload: typeof proxyPattern.patient.getManyByIds.payload
    // ): Promise<ProxyMessage<typeof proxyPattern.patient.getManyByIds.response>> {
    //     const patientsList = await this.patientService.findManyByIds(
    //         payload.ids, {
    //         ...payload.options
    //     });
    //     return {
    //         payload: patientsList.items
    //     };
    // }

    @MessagePattern(proxyPattern.patient.softDeletionById.key)
    @UseFilters(ProxyMessengerFilter)
    async handleSoftDeletionById(
        @Payload() payload: typeof proxyPattern.patient.softDeletionById.payload
    ): Promise<ProxyMessage<typeof proxyPattern.patient.softDeletionById.response>> {
        // const result = await this.patientService.softDeleteById(payload.id);
        // return { payload: result };
        return { payload: true };
    }

    // @MessagePattern(proxyPattern.patient.water.creation)
    // @UseFilters(ProxyMessengerFilter)
    // async createWaterGoal(
    //     @Payload() payload: ProxyWaterGoalDto
    // ): Promise<ProxyMessage<WaterGoal>> {
    //     const foundPatient = await this.patientService.findOne({ where: { id: payload.patientId } });
    //     if (foundPatient && foundPatient.hasNutritionist?.(payload.nutritionistId)) {
    //         return { payload: await this.waterGoalService.createWaterGoal(payload) };
    //     } else {
    //         throw new NotFoundException('Patient not found or not related to nutritionist');
    //     }
    // }

    @MessagePattern(proxyPattern.patient.water.findCurrent)
    @UseFilters(ProxyMessengerFilter)
    async findCurrentWaterGoal(
        @Payload() payload: FindCurrentWaterGoalDto
    ): Promise<ProxyMessage<WaterGoal | null>> {
        const foundWaterGoal = await this.waterGoalService.findCurrent(payload);
        console.log(foundWaterGoal);
        return { payload: foundWaterGoal };
    }

    @MessagePattern(proxyPattern.patient.water.getById.key)
    @UseFilters(ProxyMessengerFilter)
    async isWaterGoalRelatedToPatient(
        @Payload() payload: typeof proxyPattern.patient.water.getById.payload
    ): Promise<ProxyMessage<typeof proxyPattern.patient.water.getById.response>> {
        return {
            payload: await this.waterGoalService.findOne({ patientId: payload.patientId })
        };
    }
}