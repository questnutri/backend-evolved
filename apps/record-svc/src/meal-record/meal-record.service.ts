import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
    KeysOf,
    MealRecord, Meal,
    RepeatType,
    SchedulerHelper,
    DIET_SERVICE_PROXY_NAME,
    sendProxyMessage,
    proxyPattern
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MealRecordService {
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
                relativeDate: scheduler.buildDate({ date: requestDate, startOfDay: true })
            }
        });
        if (foundPreviousRecord) {
            const updated = this.mealRecordRepository.merge(foundPreviousRecord, { isCompleted: !foundPreviousRecord.isCompleted, conclusionHour: scheduler.format(requestDate, 'HH:mm:ss'), });
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
                    startOfDay: true
                });
                endDate = meal.endDate || meal.diet.endDate || null;
                if (!endDate) {
                    isValid = start <= requestDate;
                    if (!isValid) {
                        throw new BadRequestException(
                            `The date ${scheduler.format(requestDate, 'YYYY-MM-DD')} is not within the scheduled range for this meal which is starting on ${scheduler.format(start, 'YYYY-MM-DD')}.`
                        );
                    }
                } else {
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

        const dayPlan = await sendProxyMessage<
            typeof proxyPattern.diet.getDietPlanForDay.response,
            typeof proxyPattern.diet.getDietPlanForDay.payload
        >({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.getDietPlanForDay.key,
            data: { dietId: meal.diet.id, date: scheduler.format(requestDate, 'YYYY-MM-DD') }
        })

        const mealIdsForDay = dayPlan.meals.map((m: Meal) => m.id);

        const recordsForDay = await this.mealRecordRepository.find({
            where: {
                mealId: In(mealIdsForDay),
                patientId: meal.diet.patientId,
                relativeDate: Between(
                    scheduler.buildDate({ date: requestDate, startOfDay: true }),
                    scheduler.buildDate({ date: requestDate, endOfDay: true })
                )
            }
        })

        const totalMeals = mealIdsForDay.length
        const completedMeals = recordsForDay.filter(r => r.isCompleted).length

        const createdRecord = this.mealRecordRepository.create({
            mealId: meal.id,
            patientId: meal.diet.patientId,
            dietId: meal.diet.id,
            nutritionistId: meal.diet.nutritionistId,
            isCompleted: true,
            relativeDate: scheduler.buildDate({ date: requestDate, startOfDay: true }),
            expectedHour: meal.hour!,
            conclusionHour: scheduler.format(requestDate, 'HH:mm:ss'),
        });

        const savedRecord = await this.mealRecordRepository.save(createdRecord);

        return {
            ...savedRecord,
            totalMealsForDay: totalMeals,
            completedMealsForDay: completedMeals + 1
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
