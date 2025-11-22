import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindWeightOptions, PaginationQuery, WeightRecord } from '@backend-evolved/shared';
import { Repository } from 'typeorm';

@Injectable()
export class WeightRecordService {
    constructor(
        @InjectRepository(WeightRecord)
        private readonly weightRecordRepository: Repository<WeightRecord>,
    ) { }

    async findAll(find?: FindWeightOptions & PaginationQuery): Promise<WeightRecord[]> {
        let page = find?.page || 1;
        let limit = find?.limit || 20;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;

        let foundWeightRecords = await this.weightRecordRepository.find({
            where: {
                patientId: find?.patientId
            },
            skip: (page && limit) ? (page - 1) * limit : undefined,
            take: limit || undefined,
        });

        return foundWeightRecords;

    }

    async create(data: Partial<WeightRecord>): Promise<WeightRecord> {
        const weightRecord = this.weightRecordRepository.create(data);
        return await this.weightRecordRepository.save(weightRecord);
    }
}
