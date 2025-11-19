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
            throw new NotFoundException('Meal not found or user does not have access to this meal.');
        }
        return foundMeal;
    }

    async createOne(data: any): Promise<Meal> {
        const { diet } = data;

        const scheduler = new SchedulerHelper(diet.timeZone);
        const requestDate = scheduler.buildDate({ startOfDay: true });
        const disabledPastDateScheduling = process.env.DISABLE_PAST_DATE_SCHEDULING === 'true';

        if (diet.endDate && diet.endDate < requestDate) {
            throw new BadRequestException('Cannot add meal to a diet that has ended');
        }

        let validStartTargetDate = scheduler.buildDate({
            date: data.startDate, //if date is not provided, it will use request date 
            startOfDay: true
        });

        if (
            disabledPastDateScheduling && //set on .env
            data.startDate && //has sent start date on body
            diet.startDate < requestDate && //diet has already started
            validStartTargetDate < requestDate //sent start date is in the past of request date
        ) {
            throw new BadRequestException('Meal start date cannot be in the past');
        }

        //Checking if request date can be used to schedule meal start
        //otherwise will use diet start date
        if (diet?.startDate! > validStartTargetDate) {
            if (data.startDate) {
                if (diet.endDate && diet.endDate < validStartTargetDate) {
                    throw new BadRequestException(`Meal start date ${scheduler.formatDate(validStartTargetDate, 'YYYY-MM-DD HH:mm')} cannot be after diet end date ${scheduler.formatDate(diet.endDate, 'YYYY-MM-DD HH:mm')}`);
                }
                throw new BadRequestException(`Meal start date ${scheduler.formatDate(validStartTargetDate, 'YYYY-MM-DD HH:mm')} cannot be before diet start date ${scheduler.formatDate(diet.startDate, 'YYYY-MM-DD HH:mm')}`);
            }
            validStartTargetDate = diet!.startDate!;
        }

        let validEndTargetDate = null;
        if (data.endDate) {
            if (diet?.endDate) {
                validEndTargetDate = scheduler.buildDate({
                    date: diet.endDate,
                    endOfDay: true
                });

                const payloadEndDate = scheduler.buildDate({
                    date: data.endDate,
                    endOfDay: true
                });
                if (payloadEndDate > diet.endDate) {
                    throw new BadRequestException(`Meal end date ${scheduler.formatDate(payloadEndDate, 'YYYY-MM-DD HH:mm')} cannot be after diet end date ${scheduler.formatDate(diet.endDate, 'YYYY-MM-DD HH:mm')}`);
                }
                if (payloadEndDate < validStartTargetDate) {
                    throw new BadRequestException(`Meal end date ${scheduler.formatDate(payloadEndDate, 'YYYY-MM-DD HH:mm')} cannot be before meal start date ${scheduler.formatDate(validStartTargetDate, 'YYYY-MM-DD HH:mm')}`);
                }
                validEndTargetDate = payloadEndDate;
            }
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
                    if (daysOfMonth.length === 0) {
                        daysOfMonth.push(validStartTargetDate.getDate());
                    }
                    repeatConfigurationPayload['daysOfMonth'] = daysOfMonth;
                    repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
                    break;
                default:
                    throw new BadRequestException(`Invalid repeat configuration type for '${repeatConfig.type}' use only: ${Object.values(RepeatType).join(', ')}`);
            }
        }

        if (!data.hour) {
            data.hour = '00:00';
        }

        const mealData = {
            ...data,
            startDate: validStartTargetDate,
            endDate: validEndTargetDate,
            repeatConfiguration: repeatConfigurationPayload
        };

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
