import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceContract, KeysOf, MealRecord, CreateMealRecordDto, UpdateMealRecordDto, DIET_SERVICE_PROXY_NAME, ProxyMessage, MealRepeatCalculator, Meal, RepeatType, SchedulerHelper } from '@backend-evolved/shared';
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

    /**
     * Validates if a mealRelativeDate is valid according to the meal's repeat configuration
     * @param mealId - The meal ID to validate against
     * @param mealRelativeDate - The date to validate (string or Date)
     * @param patientId - The patient ID for context
     * @throws BadRequestException if the date is not valid for the meal's schedule
     */
    private async validateMealRelativeDate(mealId: string, mealRelativeDate: string | Date, patientId: string): Promise<void> {
        try {
            // Convert string date to Date object if needed
            const targetDate = typeof mealRelativeDate === 'string' ? new Date(mealRelativeDate) : mealRelativeDate;

            // Validate that the date is valid
            if (isNaN(targetDate.getTime())) {
                throw new BadRequestException(`Invalid date format: ${mealRelativeDate}. Expected format: YYYY-MM-DD`);
            }
            // Validate that the date is valid
            if (isNaN(targetDate.getTime())) {
                throw new BadRequestException(`Invalid date format: ${mealRelativeDate}. Expected format: YYYY-MM-DD`);
            }

            // Get meal and diet information
            const mealInfo = await firstValueFrom(
                this.dietServiceProxy.send<ProxyMessage<{ dietId: string, nutritionistId: string, meal: any, diet: any }>, { mealId: string, patientId: string }>('meal.getDetailedInfo', {
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

            const { meal, diet } = mealInfo.payload;

            if (!meal.repeatConfiguration) {
                // If no repeat configuration, assume it's valid (backward compatibility)
                return;
            }

            // Normalize the target date to start of day in UTC
            const normalizedTargetDate = new Date(targetDate);
            normalizedTargetDate.setUTCHours(0, 0, 0, 0);

            // Normalize diet start date
            const normalizedDietStartDate = new Date(diet.startDate);
            normalizedDietStartDate.setUTCHours(0, 0, 0, 0);

            // Calculate diet duration in days
            const dietDays = diet.endDate ?
                Math.floor((new Date(diet.endDate).getTime() - normalizedDietStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 :
                365; // Default to 1 year if no end date

            // Use MealRepeatCalculator to validate the date
            const isValidDate = MealRepeatCalculator.shouldMealBeScheduled(
                meal.repeatConfiguration,
                normalizedTargetDate,
                normalizedDietStartDate,
                dietDays
            );

            if (!isValidDate) {
                // Provide helpful error message based on repeat type
                const repeatType = meal.repeatConfiguration.type;
                const dateString = targetDate.toISOString().split('T')[0];
                const dietStartString = normalizedDietStartDate.toISOString().split('T')[0];
                const dietEndString = diet.endDate ? new Date(diet.endDate).toISOString().split('T')[0] : 'no end date';
                let errorMessage = `Date ${dateString} is not valid for meal "${meal.name}" with repeat type ${repeatType}`;

                switch (repeatType) {
                    case 'ONCE':
                        const onceDate = meal.repeatConfiguration.startDate || normalizedDietStartDate;
                        errorMessage += `. This meal is scheduled only for ${new Date(onceDate).toISOString().split('T')[0]}`;
                        break;
                    case 'WEEKLY':
                        if (meal.repeatConfiguration.daysOfWeek && meal.repeatConfiguration.daysOfWeek.length > 0) {
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const scheduledDays = meal.repeatConfiguration.daysOfWeek.map((day: number) => dayNames[day]).join(', ');
                            const sentDayOfWeek = targetDate.getDay();
                            const sentDayName = dayNames[sentDayOfWeek];
                            errorMessage += `. You sent ${sentDayName}, but this meal is scheduled for: ${scheduledDays} between ${dietStartString} and ${dietEndString}`;
                        }
                        break;
                    case 'WEEKDAYS':
                        const sentDayOfWeek = targetDate.getDay();
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const sentDayName = dayNames[sentDayOfWeek];
                        errorMessage += `. You sent ${sentDayName}, but this meal is scheduled for weekdays only (Monday-Friday) between ${dietStartString} and ${dietEndString}`;
                        break;
                    case 'MONTHLY':
                        errorMessage += `. This meal is scheduled for the same day of each month as the start date between ${dietStartString} and ${dietEndString}`;
                        break;
                    case 'MONTHLY_DATE':
                        if (meal.repeatConfiguration.dayOfMonth) {
                            errorMessage += `. This meal is scheduled for day ${meal.repeatConfiguration.dayOfMonth} of each month between ${dietStartString} and ${dietEndString}`;
                        }
                        break;
                    case 'DAILY':
                        const interval = meal.repeatConfiguration.interval || 1;
                        if (interval > 1) {
                            errorMessage += `. This meal repeats every ${interval} days between ${dietStartString} and ${dietEndString}`;
                        } else {
                            errorMessage += `. This meal is scheduled daily between ${dietStartString} and ${dietEndString}`;
                        }
                        break;
                }

                throw new BadRequestException(errorMessage);
            }

        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof RpcException) {
                throw error;
            }
            throw new BadRequestException(`Failed to validate meal date: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findAll(where: any): Promise<MealRecord[]> {
        return await this.mealRecordRepository.find({ where });
    }

    async findOneWhere(query: Partial<KeysOf<MealRecord>>): Promise<MealRecord | null> {
        return await this.mealRecordRepository.findOne({ where: query });
    }

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

    // Enhanced method for patient meal record creation with meal service integration
    async createPatientMealRecord(
        mealId: string,
        patientId: string,
        mealRelativeDate: Date,
    ): Promise<MealRecord> {
        try {
            // First, validate if the mealRelativeDate is valid for this meal's repeat configuration
            await this.validateMealRelativeDate(mealId, mealRelativeDate, patientId);

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
                    mealRelativeDate: normalizedDate
                }
            });

            if (existingRecord) {
                existingRecord.isCompleted = !existingRecord.isCompleted;
                return await this.mealRecordRepository.save(existingRecord);
            }

            const mealRecordData = {
                dietId,
                mealId,
                patientId,
                nutritionistId,
                isCompleted: true,
                mealRelativeDate: normalizedDate
            };

            const mealRecord = this.mealRecordRepository.create(mealRecordData);
            const createdMealRecord = await this.mealRecordRepository.save(mealRecord);

            //NOTIFIES GAME-SVC HERE!

            return createdMealRecord;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof RpcException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to create meal record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
