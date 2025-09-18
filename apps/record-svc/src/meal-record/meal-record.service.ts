import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceContract, KeysOf, MealRecord, CreateMealRecordDto, UpdateMealRecordDto, DIET_SERVICE_PROXY_NAME, ProxyMessage } from '@backend-evolved/shared';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MealRecordService implements ServiceContract<MealRecord> {
    constructor(
        @InjectRepository(MealRecord)
        private readonly mealRecordRepository: Repository<MealRecord>,
        @Inject(DIET_SERVICE_PROXY_NAME)
        private readonly dietServiceProxy: ClientProxy
    ) { }

    async findAll(query: Partial<KeysOf<MealRecord>> = {}): Promise<MealRecord[]> {
        return await this.mealRecordRepository.find({ where: query });
    }

    async findOne(query: Partial<KeysOf<MealRecord>>): Promise<MealRecord | null> {
        return await this.mealRecordRepository.findOne({ where: query });
    }

    async createOne(data: CreateMealRecordDto): Promise<MealRecord> {
        const mealRecord = this.mealRecordRepository.create(data);
        return await this.mealRecordRepository.save(mealRecord);
    }

    // Enhanced method for patient meal record creation with meal service integration
    async createPatientMealRecord(
        mealId: string,
        patientId: string,
        mealRelativeDate: Date,
        mealRepeatDay: number,
        isCompleted: boolean = false
    ): Promise<MealRecord> {
        try {
            // Get meal information from diet service with patient validation
            const mealInfo = await firstValueFrom(
                this.dietServiceProxy.send<ProxyMessage<{ dietId: string, nutritionistId: string }>, { mealId: string, patientId: string }>('meal.getInfo', {
                    mealId,
                    patientId
                })
            );

            if (mealInfo && 'error' in mealInfo) {
                throw new RpcException(mealInfo);
            }

            if (!mealInfo || !mealInfo.payload) {
                throw new NotFoundException(`Meal with ID ${mealId} not found`);
            }

            const { dietId, nutritionistId } = mealInfo.payload;

            // Normalize the date to ignore time part - only consider the date
            const normalizedDate = new Date(mealRelativeDate);
            normalizedDate.setHours(0, 0, 0, 0);

            // Check if a meal record already exists with the same parameters
            const existingRecord = await this.mealRecordRepository.findOne({
                where: {
                    dietId,
                    mealId,
                    patientId,
                    nutritionistId,
                    mealRelativeDate: normalizedDate,
                    mealRepeatDay
                }
            });

            if (existingRecord) {
                existingRecord.isCompleted = !existingRecord.isCompleted;
                return await this.mealRecordRepository.save(existingRecord);
                // throw new NotFoundException(`Meal record already exists for this meal on this date and repeat day`);
            }


            const mealRecordData = {
                dietId,
                mealId,
                patientId,
                nutritionistId,
                isCompleted: true,
                mealRelativeDate: normalizedDate,
                mealRepeatDay
            };

            const mealRecord = this.mealRecordRepository.create(mealRecordData);
            const createdMealRecord = await this.mealRecordRepository.save(mealRecord);

            //NOTIFIES GAME-SVC HERE!

            return createdMealRecord;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof RpcException) {
                throw error;
            }
            throw new NotFoundException(`Failed to create meal record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateOne(query: Partial<KeysOf<MealRecord>>, data: UpdateMealRecordDto): Promise<MealRecord> {
        const mealRecord = await this.mealRecordRepository.findOne({ where: query });
        if (!mealRecord) {
            throw new NotFoundException('Meal record not found');
        }
        this.mealRecordRepository.merge(mealRecord, data);
        return await this.mealRecordRepository.save(mealRecord);
    }

    async deleteOne(query: Partial<KeysOf<MealRecord>>): Promise<void> {
        const result = await this.mealRecordRepository.delete(query);
        if (result.affected === 0) {
            throw new NotFoundException('Meal record not found');
        }
    }

    // Additional methods specific to meal records
    async findByPatientId(patientId: string): Promise<MealRecord[]> {
        return await this.mealRecordRepository.find({ where: { patientId } });
    }

    async findByNutritionistId(nutritionistId: string): Promise<MealRecord[]> {
        return await this.mealRecordRepository.find({ where: { nutritionistId } });
    }

    async findByDietId(dietId: string): Promise<MealRecord[]> {
        return await this.mealRecordRepository.find({ where: { dietId } });
    }

    async markAsCompleted(id: string): Promise<MealRecord> {
        const mealRecord = await this.mealRecordRepository.findOne({ where: { id } });
        if (!mealRecord) {
            throw new NotFoundException('Meal record not found');
        }
        mealRecord.isCompleted = true;
        return await this.mealRecordRepository.save(mealRecord);
    }

    async markAsIncomplete(id: string): Promise<MealRecord> {
        const mealRecord = await this.mealRecordRepository.findOne({ where: { id } });
        if (!mealRecord) {
            throw new NotFoundException('Meal record not found');
        }
        mealRecord.isCompleted = false;
        return await this.mealRecordRepository.save(mealRecord);
    }
}
