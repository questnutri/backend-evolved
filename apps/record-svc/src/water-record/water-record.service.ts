import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecordType, SchedulerHelper, WaterRecord } from '@backend-evolved/shared';
import { Between, Repository } from 'typeorm';

@Injectable()
export class WaterRecordService {
	constructor(
		@InjectRepository(WaterRecord) private waterRecordRepository: Repository<WaterRecord>,
	) { }

	async create(data: Partial<WaterRecord>): Promise<WaterRecord> {
		const newRecord = this.waterRecordRepository.create(data);
		return await this.waterRecordRepository.save(newRecord);
	}

	async totalDailyIntake(patientId: string, date: Date, includeRegisters: boolean = false): Promise<any> {
		const scheduler = new SchedulerHelper();
		const startOfDay = scheduler.buildDate({ date, startOfDay: true });
		const endOfDay = scheduler.buildDate({ date, endOfDay: true });
		console.log({ startOfDay, endOfDay });

		const allRegistersOfToday = await this.waterRecordRepository.find({
			where: {
				patientId,
				relativeDate: Between(startOfDay, endOfDay),
			},
			order: { createdAt: 'ASC' }
		});

		const total = allRegistersOfToday.reduce(
			(acc, r) => acc + ((Number(r.amountInMl) || 0) * (r.operation === RecordType.ADD ? 1 : -1)),
			0);

		const currentDailyWaterGoal =
			allRegistersOfToday.length > 0
				? allRegistersOfToday[allRegistersOfToday.length - 1].currentDailyWaterGoal ?? null
				: null;

		const response = {
			totalIntake: total,
			currentDailyWaterGoal
		};
		if (includeRegisters) {
			Object.assign(response, { registers: allRegistersOfToday });
		}

		return response;
	}
}