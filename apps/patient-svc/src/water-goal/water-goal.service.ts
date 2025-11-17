import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindCurrentWaterGoalDto, normalizeToStartOfDay, WaterGoal } from "@backend-evolved/shared";
import { Repository } from "typeorm";

@Injectable()
export class WaterGoalService {
    constructor(
        @InjectRepository(WaterGoal)
        private readonly waterGoalRepository: Repository<WaterGoal>,
    ) { }

    async findOne(where: any): Promise<WaterGoal> {
        const foundWaterGoal = await this.waterGoalRepository.findOne({ where });
        if(!foundWaterGoal) throw new NotFoundException('Water goal not found');
        return foundWaterGoal;
    }

    async createWaterGoal(data: any): Promise<any> {
        const foundPreviousGoal = await this.waterGoalRepository.findOne({
            where: {
                patient: { id: data.patientId },
                nutritionistId: data.nutritionistId
            }
        });
        if (!data?.startDate) {
            data = { ...data, startDate: normalizeToStartOfDay(new Date()) };
        }
        console.log(data);
        if (foundPreviousGoal) {
            await this.waterGoalRepository.update({ id: foundPreviousGoal.id }, { endDate: data.startDate });
        }
        const waterGoal = this.waterGoalRepository.create(data);
        return await this.waterGoalRepository.save(waterGoal);
    }

    async findCurrent(data: FindCurrentWaterGoalDto): Promise<WaterGoal | null> {
        const waterGoals = await this.waterGoalRepository.find({
            where: {
                nutritionistId: data.nutritionistId,
                patientId: data.patientId
            },
        });

        const date = normalizeToStartOfDay(data.requestDate || new Date());

        const current = waterGoals.find(wg =>
            wg.startDate &&
            wg.startDate <= date &&
            (!wg.endDate || wg.endDate >= date)
        )

        return current || null
    }
}