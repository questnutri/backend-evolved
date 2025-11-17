import { Controller, NotFoundException, UseFilters } from '@nestjs/common';
import { PatientService, TreatedPatient } from './patient.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
    ProxyMessengerFilter,
    ProxyMessage,
    Patient,
    proxyPattern,
    BodyCreatePatientDto,
    ProxyWaterGoalDto,
    WaterGoal,
    normalizeToStartOfDay,
    FindCurrentWaterGoalDto,
} from '@backend-evolved/shared';
import { WaterGoalService } from '../water-goal/water-goal.service';

@Controller()
export class PatientProxyController {
    constructor(
        private readonly patientService: PatientService,
        private readonly waterGoalService: WaterGoalService,
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
    async getById(@Payload() payload: { id: string }): Promise<ProxyMessage<Patient>> {
        return { payload: await this.patientService.findOneWhere({ id: payload.id }) };
    }

    @MessagePattern(proxyPattern.patient.water.creation)
    @UseFilters(ProxyMessengerFilter)
    async createWaterGoal(
        @Payload() payload: ProxyWaterGoalDto
    ): Promise<ProxyMessage<WaterGoal>> {
        const foundPatient = await this.patientService.findOneWhere({ id: payload.patientId });
        if (foundPatient && foundPatient.hasNutritionist?.(payload.nutritionistId)) {
            return { payload: await this.waterGoalService.createWaterGoal(payload) };
        } else {
            throw new NotFoundException('Patient not found or not related to nutritionist');
        }
    }

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
        @Payload() payload: typeof proxyPattern.patient.water.getById.send
    ): Promise<ProxyMessage<typeof proxyPattern.patient.water.getById.receive>> {
        return {
            payload: await this.waterGoalService.findOne({ patientId: payload.patientId })
        };
    }
}