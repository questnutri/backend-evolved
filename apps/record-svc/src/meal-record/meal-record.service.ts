import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceContract, KeysOf, MealRecord, DIET_SERVICE_PROXY_NAME, ProxyMessage, Meal, RepeatType, SchedulerHelper } from '@backend-evolved/shared';
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

    async findAll(where: any): Promise<MealRecord[]> {
        return await this.mealRecordRepository.find({ where });
    }

    async findOneWhere(query: Partial<KeysOf<MealRecord>>): Promise<MealRecord | null> {
        return await this.mealRecordRepository.findOne({ where: query });
    }

    //FIXME: CHECK IF IS WORKING
    async createOrUpdate(meal: Meal, date?: string, time?: string): Promise<any> {
        const scheduler = new SchedulerHelper(meal.diet.timeZone);
        const requestDate = scheduler.buildDate({
            date,
            time
        });

        const foundPreviousRecord = await this.mealRecordRepository.findOne({
            where: {
                mealId: meal.id,
                patientId: meal.diet.patientId,
                dietId: meal.diet.id,
                nutritionistId: meal.diet.nutritionistId,
                mealRelativeDate: scheduler.buildDate({ date: requestDate, startOfDay: true, offset: { day: -1 } })
            }
        });
        if (foundPreviousRecord) {
            const updated = this.mealRecordRepository.merge(foundPreviousRecord, { isCompleted: !foundPreviousRecord.isCompleted });
            return await this.mealRecordRepository.save(updated);
        }

        const { repeatConfiguration } = meal;
        let start;
        let end;
        let endDate;
        let isValid;

        switch (repeatConfiguration.type) {
            case RepeatType.ONCE:
                start = scheduler.buildDate({
                    date: repeatConfiguration.targetDate,
                    time: meal!.hour!
                });
                end = scheduler.buildDate({
                    date: repeatConfiguration.targetDate,
                    endOfDay: true
                });
                isValid = scheduler.isBetween({
                    start,
                    end,
                    target: requestDate,
                });

                if (!isValid) {
                    throw new BadRequestException(`The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not valid for this meal which is scheduled once on ${scheduler.format(repeatConfiguration.targetDate!, 'YYYY-MM-DD')}.`)
                }
                break;
            case RepeatType.DAILY:
                start = scheduler.buildDate({
                    date: meal.startDate!,
                });
                endDate = meal.endDate || meal.diet.endDate;
                end = scheduler.buildDate({
                    date: endDate!,
                });
                isValid = scheduler.isBetween({
                    start,
                    end,
                    target: requestDate,
                });

                if (!isValid) {
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not within the scheduled range for this meal which is between ${scheduler.format(start, 'YYYY-MM-DD')} and ${scheduler.format(end, 'YYYY-MM-DD')}.`
                    );
                }

                const daysFromMealStart = scheduler.getDaysDifference(
                    start,
                    requestDate
                );
                const interval = repeatConfiguration.repeatTarget!;
                if ((daysFromMealStart % interval) !== 0)
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not valid for this meal which repeats every ${interval} day(s) starting from ${scheduler.format(meal.startDate!, 'YYYY-MM-DD')}.`);
                break;
            case RepeatType.WEEKLY:
                //First check if the day of week matches
                const requestDayOfWeek = requestDate.getDay();
                if (!(repeatConfiguration.daysOfWeek!.includes(requestDayOfWeek))) {
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} which is equivalent to ${requestDate.getDay()} is not valid for this meal which is scheduled on days [${repeatConfiguration.daysOfWeek}] of the week.`
                    );
                };

                //Then check if within start and end dates
                start = scheduler.buildDate({
                    date: meal.startDate!,
                });
                endDate = meal.endDate || meal.diet.endDate;
                end = scheduler.buildDate({
                    date: endDate!,
                    endOfDay: true
                });
                isValid = scheduler.isBetween({
                    start,
                    end,
                    target: requestDate,
                });

                if (!isValid) {
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not within the scheduled range for this meal which is between ${scheduler.format(start, 'YYYY-MM-DD')} and ${scheduler.format(end, 'YYYY-MM-DD')}.`
                    );
                }

                //Finally check the weekly interval
                const weeksFromMealStart = scheduler.getWeeksDifference(
                    start,
                    requestDate
                );
                const weeklyInterval = repeatConfiguration.repeatTarget!;
                if (!((weeksFromMealStart % weeklyInterval) === 0))
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not valid for this meal which repeats every ${weeklyInterval} week(s) starting from ${scheduler.format(meal.startDate!, 'YYYY-MM-DD')}.`
                    );
                break;
            case RepeatType.MONTHLY:
                //First check if the day of month matches
                const requestDayOfMonth = scheduler.buildDate({
                    date: requestDate,
                    endOfDay: true
                }).getDate();

                if (!(repeatConfiguration.daysOfMonth!.includes(requestDayOfMonth))) {
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} which is day ${requestDayOfMonth} of the month is not valid for this meal which is scheduled on days [${repeatConfiguration.daysOfMonth}] of the month.`
                    );
                };
                //Then check if within start and end dates
                start = scheduler.buildDate({
                    date: meal.startDate!,
                });
                const monthEndDate = meal.endDate || meal.diet.endDate;
                end = scheduler.buildDate({
                    date: monthEndDate!,
                    endOfDay: true
                });
                isValid = scheduler.isBetween({
                    start,
                    end,
                    target: requestDate,
                });

                if (!isValid) {
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not within the scheduled range for this meal which is between ${scheduler.format(start, 'YYYY-MM-DD')} and ${scheduler.format(end, 'YYYY-MM-DD')}.`
                    );
                }

                //Finally check the monthly interval
                const monthsFromMealStart = scheduler.getMonthsDifference(
                    start,
                    requestDate
                );
                const monthlyInterval = repeatConfiguration.repeatTarget!;
                if (!((monthsFromMealStart % monthlyInterval) === 0)) {
                    throw new BadRequestException(
                        `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not valid for this meal which repeats every ${monthlyInterval} month(s) starting from ${scheduler.format(meal.startDate!, 'YYYY-MM-DD')}.`
                    );
                }
                break;
        }
        const createdRecord = this.mealRecordRepository.create({
            mealId: meal.id,
            patientId: meal.diet.patientId,
            dietId: meal.diet.id,
            nutritionistId: meal.diet.nutritionistId,
            isCompleted: true,
            mealRelativeDate: scheduler.buildDate({ date: requestDate, startOfDay: true, offset: { day: -1 } })
        });

        return await this.mealRecordRepository.save(createdRecord);
    }

    // // Enhanced method for patient meal record creation with meal service integration
    // async createPatientMealRecord(
    //     mealId: string,
    //     patientId: string,
    //     mealRelativeDate: Date,
    // ): Promise<MealRecord> {
    //     try {
    //         // First, validate if the mealRelativeDate is valid for this meal's repeat configuration
    //         await this.validateMealRelativeDate(mealId, mealRelativeDate, patientId);

    //         // Get meal information from diet service with patient validation
    //         const mealInfo = await firstValueFrom(
    //             this.dietServiceProxy.send<ProxyMessage<{ dietId: string, nutritionistId: string }>, { mealId: string, patientId: string }>('meal.getInfo', {
    //                 mealId,
    //                 patientId
    //             })
    //         );

    //         if (mealInfo && 'error' in mealInfo) {
    //             throw new RpcException(mealInfo);
    //         }

    //         if (!mealInfo || !mealInfo.payload) {
    //             throw new NotFoundException(`Meal with ID ${mealId} not found`);
    //         }

    //         const { dietId, nutritionistId } = mealInfo.payload;

    //         // Normalize the date to ignore time part - only consider the date
    //         const normalizedDate = new Date(mealRelativeDate);
    //         normalizedDate.setHours(0, 0, 0, 0);

    //         // Check if a meal record already exists with the same parameters
    //         const existingRecord = await this.mealRecordRepository.findOne({
    //             where: {
    //                 dietId,
    //                 mealId,
    //                 patientId,
    //                 nutritionistId,
    //                 mealRelativeDate: normalizedDate
    //             }
    //         });

    //         if (existingRecord) {
    //             existingRecord.isCompleted = !existingRecord.isCompleted;
    //             return await this.mealRecordRepository.save(existingRecord);
    //         }

    //         const mealRecordData = {
    //             dietId,
    //             mealId,
    //             patientId,
    //             nutritionistId,
    //             isCompleted: true,
    //             mealRelativeDate: normalizedDate
    //         };

    //         const mealRecord = this.mealRecordRepository.create(mealRecordData);
    //         const createdMealRecord = await this.mealRecordRepository.save(mealRecord);

    //         //NOTIFIES GAME-SVC HERE!

    //         return createdMealRecord;
    //     } catch (error) {
    //         if (error instanceof NotFoundException || error instanceof RpcException || error instanceof BadRequestException) {
    //             throw error;
    //         }
    //         throw new BadRequestException(`Failed to create meal record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //     }
    // }

    // async updateOne(query: Partial<KeysOf<MealRecord>>, data: UpdateMealRecordDto): Promise<MealRecord> {
    //     const mealRecord = await this.mealRecordRepository.findOne({ where: query });
    //     if (!mealRecord) {
    //         throw new NotFoundException('Meal record not found');
    //     }
    //     this.mealRecordRepository.merge(mealRecord, data);
    //     return await this.mealRecordRepository.save(mealRecord);
    // }

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
