import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContextUser, FindWeightOptions, ListResponse, normalizeToList, PaginationQuery, SchedulerHelper, UserRole, WeightRecord } from '@backend-evolved/shared';
import { Between, Repository } from 'typeorm';

@Injectable()
export class WeightRecordService {
    constructor(
        @InjectRepository(WeightRecord)
        private readonly weightRecordRepository: Repository<WeightRecord>,
    ) { }

    async findAll(
        requestedBy: ContextUser,
        find?: { patientId: string } & FindWeightOptions & PaginationQuery
    ): Promise<ListResponse<WeightRecord>> {
        const page = find?.page && find.page > 0 ? find.page : 1;
        const limit = find?.limit && find.limit > 0 ? find.limit : 20;

        let where: any = {
            patientId: find?.patientId
        };

        if (find?.startDate || find?.endDate) {
            const scheduler = new SchedulerHelper();
            console.log(scheduler.buildDate({
                date: find.startDate
            }))

            where.createdAt = Between(
                scheduler.buildDate({
                    date: find.startDate,
                    startOfDay: true
                }),
                scheduler.buildDate({
                    date: find.endDate,
                    endOfDay: true
                })
            );
        }

        let [items, totalItems] = await this.weightRecordRepository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC'
            }
        });

        if (requestedBy.role === UserRole.NUTRITIONIST) {
            items = items.filter(item => {
                return item.registeredBy.role !== UserRole.NUTRITIONIST || (
                    item.registeredBy.userId === requestedBy.id
                )
            });
        }

        return normalizeToList(items, totalItems, page, limit);
    }

    async create(data: Partial<WeightRecord>, ctxUser: ContextUser): Promise<WeightRecord> {
        const weightRecord = this.weightRecordRepository.create({
            ...data,
            registeredBy: {
                role: ctxUser.role,
                userId: ctxUser.id
            }
        });
        return await this.weightRecordRepository.save(weightRecord);
    }
}
