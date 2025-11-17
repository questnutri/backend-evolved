import { Inject, Injectable } from '@nestjs/common';
import { Dto_CreateWaterRecord } from './dto/create-water-record.dto';
import { UpdateWaterRecordDto } from './dto/update-water-record.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { normalizeToStartOfDay, PATIENT_SERVICE_PROXY_NAME, proxyPattern, sendProxyMessage, WaterRecord } from '@backend-evolved/shared';
import { Between, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class WaterRecordService {
	constructor(
		@InjectRepository(WaterRecord)
		private waterRecordRepository: Repository<WaterRecord>,
		@Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
	) { }

	async create(createWaterRecordDto: Dto_CreateWaterRecord) {
		const { patientId, waterGoalId, amountInMl } = createWaterRecordDto;
		const foundWaterGoal = await sendProxyMessage<
			typeof proxyPattern.patient.water.getById.receive,
			typeof proxyPattern.patient.water.getById.send
		>({
			proxy: this.patientServiceProxy,
			pattern: proxyPattern.patient.water.getById.key,
			data: {
				patientId,
				waterGoalId
			}
		});
		const newWaterRecord = this.waterRecordRepository.create({
			patientId: foundWaterGoal.patientId,
			waterGoalId: foundWaterGoal.id,
			nutritionistId: foundWaterGoal.nutritionistId,
			amountInMl,
		});
		return await this.waterRecordRepository.save(newWaterRecord);
	}

	async findAllFromWaterGoal({ waterGoalId, patientId, relativeDate }: { waterGoalId: string; patientId: string; relativeDate: Date }) {
		const foundWaterGoal = await sendProxyMessage<
			typeof proxyPattern.patient.water.getById.receive,
			typeof proxyPattern.patient.water.getById.send
		>({
			proxy: this.patientServiceProxy,
			pattern: proxyPattern.patient.water.getById.key,
			data: {
				patientId,
				waterGoalId
			}
		});

		const start = normalizeToStartOfDay(relativeDate)
		const end = new Date(start.getTime() + 86399999)

		const foundWaterGoals = await this.waterRecordRepository.find({
			where: {
				patientId: foundWaterGoal.patientId,
				waterGoalId: foundWaterGoal.id,
        	createdAt: Between(start, end)
			},
			order: {
				createdAt: 'DESC'
			}
		});
		const totalRegistered = foundWaterGoals.reduce((sum, record) => sum + record.amountInMl, 0);
		return {
			...foundWaterGoal,
			records: foundWaterGoals,
			totalRegistered
		};
	}

	findOne(id: number) {
		return `This action returns a #${id} waterRecord`;
	}

	update(id: number, updateWaterRecordDto: UpdateWaterRecordDto) {
		return `This action updates a #${id} waterRecord`;
	}

	remove(id: number) {
		return `This action removes a #${id} waterRecord`;
	}
}
