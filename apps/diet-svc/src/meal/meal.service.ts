import { CreateMealDto, KeysOf, Meal, ServiceContract, RepeatType, RepeatConfiguration, getUTCTodayStart, normalizeToStartOfDay, getUTCYesterdayEnd, SchedulerHelper } from '@backend-evolved/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MealService implements ServiceContract<Meal> {
    constructor(
        @InjectRepository(Meal)
        private readonly mealRepository: Repository<Meal>
    ) { }

    async findAll(query: { [key in keyof Meal]?: any } = {}) {
        return await this.mealRepository.find({ where: query });
    }

    async findOneWhere(where: any = {}, relations: string[] = ['diet']): Promise<Meal> {
        const foundMeal = await this.mealRepository.findOne({ where, relations });
        if (!foundMeal) {
            throw new NotFoundException('Meal not found');
        }
        return foundMeal;
    }

    async createOne(data: any): Promise<Meal> {
        const scheduler = new SchedulerHelper(data.diet.timeZone);
        let validStartTargetDate = scheduler.buildDate({ startOfDay: true });
        if (data.diet?.startDate! > validStartTargetDate) {
            validStartTargetDate = data.diet!.startDate!;
        }
        let validEndTargetDate = null;
        if (data.diet?.endDate) {
            validEndTargetDate = scheduler.buildDate({
                date: data.diet.endDate,
                endOfDay: true
            });
        }

        let repeatConfigurationPayload: any = {};
        const repeatConfig = data.repeatConfiguration

        //If no repeat configuration is provided, set default to ONCE starting today
        if (!repeatConfig) {
            console.log('No repeat configuration provided, setting default to ONCE');
            repeatConfigurationPayload = {
                type: RepeatType.ONCE,
                targetDate: validStartTargetDate,
            };
        } else {
            switch (repeatConfig.type) {
                case RepeatType.ONCE:
                    repeatConfigurationPayload['type'] = RepeatType.ONCE;
                    const configTargetDate = repeatConfig.targetDate;
                    if (!configTargetDate) {
                        repeatConfigurationPayload['targetDate'] = validEndTargetDate;
                    } else {
                        const scheduledDate = scheduler.buildDate({
                            date: configTargetDate,
                            startOfDay: true
                        });
                        if (scheduledDate < validStartTargetDate) {
                            throw new BadRequestException(`Target date cannot be in the past compared to diet start date of: ${validStartTargetDate.toISOString()}`);
                        } else if (validEndTargetDate && scheduledDate > validEndTargetDate) {
                            throw new BadRequestException(`Target date cannot be after diet end date of: ${validEndTargetDate.toISOString()}`);
                        } else {
                            repeatConfigurationPayload['targetDate'] = scheduledDate;
                        }
                    }
                    break;
                //Read as: every X days. If X === 1, every day
                case RepeatType.DAILY:
                    repeatConfigurationPayload['type'] = RepeatType.DAILY;
                    repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
                    break;
                //Read as every [day of week]
                case RepeatType.WEEKLY:
                    repeatConfigurationPayload['type'] = RepeatType.WEEKLY;
                    const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6];

                    const originalDays = Array.isArray(repeatConfig.daysOfWeek) ? repeatConfig.daysOfWeek : [];
                    const filteredDays = originalDays.filter((day: number) => VALID_DAYS.includes(day));
                    const uniqueDaysSet = new Set(filteredDays);

                    if (uniqueDaysSet.size === 0) {
                        uniqueDaysSet.add(0);
                    }

                    repeatConfig.daysOfWeek = [...uniqueDaysSet];
                    repeatConfigurationPayload['daysOfWeek'] = repeatConfig.daysOfWeek;
                    repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
                    break;
                case RepeatType.MONTHLY:
                    repeatConfigurationPayload['type'] = RepeatType.MONTHLY;
                    const daysOfMonth = repeatConfig.daysOfMonth || [];
                    if(daysOfMonth.length === 0) {
                        daysOfMonth.push(validStartTargetDate.getDate());
                    }
                    repeatConfigurationPayload['daysOfMonth'] = daysOfMonth;
                    repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
                    break;
                default:
                    throw new NotFoundException('Invalid repeat configuration type');
            }
        }

        if (!data.hour) {
            data.hour = '00:00';
        }

        let newStartDate = scheduler.buildDate({
            startOfDay: true
        });

        if (newStartDate < data.diet?.startDate!) {
            newStartDate = data.diet!.startDate!;
        }

        const mealData = { ...data, startDate: newStartDate, endDate: null, repeatConfiguration: repeatConfigurationPayload };

        const meal = this.mealRepository.create(mealData);
        const saved: any = await this.mealRepository.save(meal);
        const reloaded = await this.mealRepository.findOne({ where: { id: saved.id }, relations: ['diet'] });
        if (reloaded && reloaded.diet) {
            // @ts-ignore
            delete reloaded.diet.meals;
        }
        return reloaded as Meal;
    }


    async updateOne(query: Partial<KeysOf<Meal>>, data: Partial<Meal>): Promise<Meal | null> {
        const meal = await this.mealRepository.findOne({ where: query as any });
        if (!meal) return null;
        await this.mealRepository.update(meal.id, data);
        return await this.mealRepository.findOne({ where: { id: meal.id } });
    }

    async deleteOne(query: Partial<KeysOf<Meal>>): Promise<void> {
        const meal = await this.mealRepository.findOne({ where: query as any });
        if (!meal) throw new NotFoundException('Meal not found');
        await this.mealRepository.delete(meal.id);
    }

    async findById(id: string) {
        return await this.mealRepository.findOne({ where: { id, validTo: null } as any, relations: ['diet'] });
    }

    async update(id: string, data: Partial<CreateMealDto>) {
        const currentMeal = await this.mealRepository.findOne({
            where: { id, validTo: null } as any
        });

        if (!currentMeal) throw new NotFoundException('Meal not found');
        const newValidFrom = getUTCTodayStart();
        if (newValidFrom.getTime() > currentMeal!.startDate!.getTime()) {
            const yesterdayEnd = getUTCYesterdayEnd(newValidFrom);

            // Close the current version's effective range
            await this.mealRepository.update(currentMeal.id, { endDate: yesterdayEnd });

            // 4. Create a NEW version (temporal record)
            const newMealData = {
                ...currentMeal,
                ...data, // new data overrides old
                validFrom: newValidFrom,
                validTo: null,
                diet: currentMeal.diet,
            };

            const newMeal = this.mealRepository.create(newMealData);
            const saved = await this.mealRepository.save(newMeal);

            // Re-fetch with relations for the return value
            return await this.mealRepository.findOne({ where: { id: saved.id }, relations: ['diet'] });
        } else {
            // Same day update - update existing record
            await this.mealRepository.update(currentMeal.id, data);
            return await this.findById(currentMeal.id);
        }
    }


    async delete(id: string) {
        const currentMeal = await this.mealRepository.findOne({
            where: { id, validTo: null } as any
        });

        if (!currentMeal) throw new NotFoundException('Meal not found');

        const newValidFrom = getUTCTodayStart();
        const yesterdayEnd = getUTCYesterdayEnd(newValidFrom);

        await this.mealRepository.update(currentMeal.id, { endDate: yesterdayEnd, isActive: false });
        return await this.findById(currentMeal.id);
    }

    // Method for meal record service to get meal information with patient validation
    async getMealInfo(mealId: string, patientId?: string): Promise<{ dietId: string, nutritionistId: string } | null> {
        const meal = await this.mealRepository.findOne({
            where: { id: mealId },
            relations: ['diet']
        });

        if (!meal || !meal.diet) {
            return null;
        }

        // If patientId is provided, validate that the patient is assigned to this diet
        if (patientId && meal.diet.patientId !== patientId) {
            return null; // Patient is not assigned to this diet
        }

        return {
            dietId: meal.diet.id,
            nutritionistId: meal.diet.nutritionistId
        };
    }

    // Method for meal record service to get detailed meal information with patient validation
    async getMealDetailedInfo(mealId: string, patientId?: string): Promise<{ dietId: string, nutritionistId: string, meal: any, diet: any } | null> {
        const meal = await this.mealRepository.findOne({
            where: { id: mealId },
            relations: ['diet']
        });

        if (!meal || !meal.diet) {
            return null;
        }

        // If patientId is provided, validate that the patient is assigned to this diet
        if (patientId && meal.diet.patientId !== patientId) {
            return null; // Patient is not assigned to this diet
        }

        return {
            dietId: meal.diet.id,
            nutritionistId: meal.diet.nutritionistId,
            meal: {
                id: meal.id,
                name: meal.name,
                repeatConfiguration: meal.repeatConfiguration,
                hour: meal.hour,
                isActive: meal.isActive
            },
            diet: {
                id: meal.diet.id,
                startDate: meal.diet.startDate,
                endDate: meal.diet.endDate,
                patientId: meal.diet.patientId,
                nutritionistId: meal.diet.nutritionistId
            }
        };
    }
}
