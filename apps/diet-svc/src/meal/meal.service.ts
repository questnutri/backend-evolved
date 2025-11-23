import {
    Meal,
    ServiceContract,
    RepeatType,
    SchedulerHelper,
    errorMessagePattern,
    DietStatus
} from '@backend-evolved/shared';
import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodService } from '../food/food.service';

@Injectable()
export class MealService implements ServiceContract<Meal> {
    constructor(
        @InjectRepository(Meal)
        private readonly mealRepository: Repository<Meal>,
        private readonly foodService: FoodService
    ) { }

    async findAll(query: { [key in keyof Meal]?: any } = {}) {
        return await this.mealRepository.find({ where: query });
    }

    async findOneWhere(where: any = {}, relations: string[] = ['diet']): Promise<Meal> {
        const foundMeal = await this.mealRepository.findOne({ where, relations });
        if (!foundMeal) {
            throw new NotFoundException(errorMessagePattern.meal.notFound.key);
        }
        return foundMeal;
    }

    async createOne(data: any): Promise<Meal> {
        const { diet } = data;
        const validated = this.validateAndBuildMealPayload(diet, data);

        // const scheduler = new SchedulerHelper(diet.timeZone);
        // scheduler.setFormat('YYYY-MM-DD HH:mm')

        // const requestDate = scheduler.buildDate({ startOfDay: true });
        // const disabledPastDateScheduling = process.env.DISABLE_PAST_DATE_SCHEDULING === 'true';

        // if (diet.endDate && diet.endDate < requestDate) {
        //     throw new BadRequestException(
        //         errorMessagePattern
        //             .meal
        //             .cannotAddToEndedDiet
        //             .key
        //     );
        // }

        // let validStartTargetDate = scheduler.buildDate({
        //     date: data.startDate, //if date is not provided, it will use request date 
        //     startOfDay: true
        // });

        // if (
        //     disabledPastDateScheduling && //set on .env
        //     data.startDate && //has sent start date on body
        //     diet.startDate < requestDate && //diet has already started
        //     validStartTargetDate < requestDate //sent start date is in the past of request date
        // ) {
        //     throw new BadRequestException(
        //         errorMessagePattern
        //             .meal
        //             .startDateCannotBeInPast
        //             .fn(scheduler.format(requestDate))
        //     );
        // }

        // //Checking if request date can be used to schedule meal start
        // //Otherwise will use diet start date
        // if (diet?.startDate! > validStartTargetDate) {
        //     if (data.startDate) {
        //         if (diet.endDate && diet.endDate < validStartTargetDate) {
        //             throw new BadRequestException(
        //                 errorMessagePattern
        //                     .meal
        //                     .startDateAfterDietEndDate
        //                     .fn(scheduler.format(validStartTargetDate), scheduler.format(diet.endDate)));
        //         }
        //         throw new BadRequestException(
        //             errorMessagePattern
        //                 .meal
        //                 .startDateBeforeDietStartDate
        //                 .fn(scheduler.format(validStartTargetDate), scheduler.format(diet.startDate!)));
        //     }
        //     validStartTargetDate = diet!.startDate!;
        // }

        // let validEndTargetDate = null;
        // if (data.endDate) {
        //     if (diet?.endDate) {
        //         validEndTargetDate = scheduler.buildDate({
        //             date: diet.endDate,
        //             endOfDay: true
        //         });

        //         const payloadEndDate = scheduler.buildDate({
        //             date: data.endDate,
        //             endOfDay: true
        //         });
        //         if (payloadEndDate > diet.endDate) {
        //             throw new BadRequestException(
        //                 errorMessagePattern
        //                     .meal
        //                     .endDateAfterDietEndDate
        //                     .fn(scheduler.format(payloadEndDate), scheduler.format(diet.endDate)));
        //         }
        //         if (payloadEndDate < validStartTargetDate) {
        //             throw new BadRequestException(
        //                 errorMessagePattern
        //                     .meal
        //                     .endDateBeforeMealStartDate
        //                     .fn(scheduler.format(payloadEndDate), scheduler.format(validStartTargetDate)));
        //         }
        //         validEndTargetDate = payloadEndDate;
        //     }
        // }

        // //FIXME: CREATE NEW CHECK IN ORDER TO SEE IF VALID START DATE IS <= DIET END DATE

        // let repeatConfigurationPayload: any = {};
        // const repeatConfig = data.repeatConfiguration

        // //If no repeat configuration is provided, set default to ONCE starting today
        // if (!repeatConfig) {
        //     repeatConfigurationPayload = {
        //         type: RepeatType.ONCE,
        //         targetDate: validStartTargetDate,
        //     };
        // } else {
        //     switch (repeatConfig.type) {
        //         case RepeatType.ONCE:
        //             repeatConfigurationPayload['type'] = RepeatType.ONCE;
        //             const configTargetDate = repeatConfig.targetDate;
        //             if (!configTargetDate) {
        //                 repeatConfigurationPayload['targetDate'] = validEndTargetDate;
        //             } else {
        //                 const scheduledDate = scheduler.buildDate({
        //                     date: configTargetDate,
        //                     startOfDay: true
        //                 });
        //                 if (scheduledDate < validStartTargetDate) {
        //                     throw new BadRequestException(
        //                         errorMessagePattern
        //                             .meal
        //                             .targetDateBeforeDietStartDate
        //                             .fn(scheduler.format(validStartTargetDate))
        //                     );
        //                 } else if (validEndTargetDate && scheduledDate > validEndTargetDate) {
        //                     throw new BadRequestException(
        //                         errorMessagePattern
        //                             .meal
        //                             .targetDateAfterDietEndDate
        //                             .fn(scheduler.format(validEndTargetDate))
        //                     );
        //                 } else {
        //                     repeatConfigurationPayload['targetDate'] = scheduledDate;
        //                 }
        //             }
        //             break;
        //         //Read as: every X days. If X === 1, every day
        //         case RepeatType.DAILY:
        //             repeatConfigurationPayload['type'] = RepeatType.DAILY;
        //             repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
        //             break;
        //         //Read as every [day of week]
        //         case RepeatType.WEEKLY:
        //             repeatConfigurationPayload['type'] = RepeatType.WEEKLY;
        //             const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6];

        //             const originalDays = Array.isArray(repeatConfig.daysOfWeek) ? repeatConfig.daysOfWeek : [];
        //             const filteredDays = originalDays.filter((day: number) => VALID_DAYS.includes(day));
        //             const uniqueDaysSet = new Set(filteredDays);

        //             if (uniqueDaysSet.size === 0) {
        //                 uniqueDaysSet.add(0);
        //             }

        //             repeatConfig.daysOfWeek = [...uniqueDaysSet];
        //             repeatConfigurationPayload['daysOfWeek'] = repeatConfig.daysOfWeek;
        //             repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
        //             break;
        //         case RepeatType.MONTHLY:
        //             repeatConfigurationPayload['type'] = RepeatType.MONTHLY;
        //             const daysOfMonth = repeatConfig.daysOfMonth || [];
        //             if (daysOfMonth.length === 0) {
        //                 daysOfMonth.push(validStartTargetDate.getDate());
        //             }
        //             repeatConfigurationPayload['daysOfMonth'] = daysOfMonth;
        //             repeatConfigurationPayload['repeatTarget'] = repeatConfig.repeatTarget || 1;
        //             break;
        //         default:
        //             throw new BadRequestException(
        //                 errorMessagePattern
        //                     .meal
        //                     .invalidRepeatConfiguration
        //                     .fn(repeatConfig.type)
        //             );
        //     }
        // }

        // if (!data.hour) {
        //     data.hour = '00:00';
        // }

        const mealData = {
            ...data,
            ...validated
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

    async clone(meal: Meal, cloneOptions: {
        includeFoods?: boolean,
        overrideProperties?: Partial<Meal>
    }): Promise<Meal> {
        const { id, startDate, endDate, createdAt, updatedAt, foods, ...rest } = meal;
        const clonedMeal = this.mealRepository.create({ ...rest, ...(cloneOptions.overrideProperties || {}) });
        const savedClonedMeal = await this.mealRepository.save(clonedMeal, { reload: true });
        if (cloneOptions.includeFoods && foods && foods.length > 0) {
            const clonedFoods = await this.foodService.cloneMany(foods, { meal: savedClonedMeal });
            savedClonedMeal.foods = clonedFoods as any;
        }
        return savedClonedMeal;
    }

    async cloneMany(
        meals: Meal[],
        cloneOptions: {
            includeFoods?: boolean,
            overrideProperties?: Partial<Meal>
        }
    ): Promise<Meal[]> {
        if (!meals || meals.length === 0) return [];

        const tasks = meals.map(async meal => {
            const { id, startDate, endDate, createdAt, updatedAt, foods, ...rest } = meal;
            const clonedMeal = this.mealRepository.create({ ...rest, ...(cloneOptions.overrideProperties || {}) });
            const savedClonedMeal = await this.mealRepository.save(clonedMeal, { reload: true });
            if (cloneOptions.includeFoods && foods && foods.length > 0) {
                const clonedFoods = await this.foodService.cloneMany(foods, { meal: savedClonedMeal });
                savedClonedMeal.foods = clonedFoods as any;
            }
            return savedClonedMeal;
        });

        const results = await Promise.all(tasks);
        return results;
    }

    async findById(id: string) {
        return await this.mealRepository.findOne({ where: { id, validTo: null } as any, relations: ['diet'] });
    }

    async updateOne(meal: Meal, data: Partial<Meal>): Promise<Meal> {
        const scheduler = new SchedulerHelper(meal.diet.timeZone)
        const today = scheduler.buildDate({ startOfDay: true })
        const isDefinition = meal.diet.status === DietStatus.DEFINITION
        const startInFuture = meal.startDate! > today

        const validated = this.validateAndBuildMealPayload(meal.diet, { ...meal, ...data });
        console.log(validated);

        if (isDefinition || startInFuture) {
            this.mealRepository.merge(meal, validated)
            return await this.mealRepository.save(meal)
        }

        const clonedMeal = await this.clone(meal, {
            includeFoods: true,
            overrideProperties: {
                ...validated
            }
        })

        meal.endDate = today
        await this.mealRepository.save(meal)

        return clonedMeal
    }

    async updateOneWhere(where: any, data: Partial<Meal>): Promise<Meal> {
        const meal = await this.findOneWhere(where);
        return await this.updateOne(meal, data);
    }

    async updateById(id: string, data: Partial<Meal>): Promise<Meal> {
        const foundMeal = await this.findOneWhere({ id });
        return await this.updateOne(foundMeal, data);
    }

    async delete(meal: Meal | Meal[]) {
        await this.foodService.delete(Array.isArray(meal) ? meal.flatMap(m => m.foods || []) : meal.foods || []);
        await this.mealRepository.remove(Array.isArray(meal) ? meal : [meal]);
    }

    async deleteOneWhere(where: any): Promise<void> {
        const foundMeal = await this.findOneWhere(where);
        await this.delete(foundMeal);
    }

    async deleteById(id: string): Promise<void> {
        const foundMeal = await this.findOneWhere({ id });
        await this.delete(foundMeal);
    }

    private validateAndBuildMealPayload(diet: any, data: any) {
        const scheduler = new SchedulerHelper(diet.timeZone)
        scheduler.setFormat('YYYY-MM-DD HH:mm')

        const requestDate = scheduler.buildDate({ startOfDay: true })
        const disabledPastDateScheduling = process.env.DISABLE_PAST_DATE_SCHEDULING === 'true'

        if (diet.endDate && diet.endDate < requestDate) {
            throw new BadRequestException(errorMessagePattern.meal.cannotAddToEndedDiet.key)
        }

        let validStartTargetDate = scheduler.buildDate({
            date: data.startDate,
            startOfDay: true
        })

        if (
            disabledPastDateScheduling &&
            data.startDate &&
            diet.startDate < requestDate &&
            validStartTargetDate < requestDate
        ) {
            throw new BadRequestException(
                errorMessagePattern.meal.startDateCannotBeInPast.fn(scheduler.format(requestDate))
            )
        }

        if (diet.startDate > validStartTargetDate) {
            if (data.startDate) {
                if (diet.endDate && diet.endDate < validStartTargetDate) {
                    throw new BadRequestException(
                        errorMessagePattern.meal.startDateAfterDietEndDate.fn(
                            scheduler.format(validStartTargetDate),
                            scheduler.format(diet.endDate)
                        )
                    )
                }
                throw new BadRequestException(
                    errorMessagePattern.meal.startDateBeforeDietStartDate.fn(
                        scheduler.format(validStartTargetDate),
                        scheduler.format(diet.startDate)
                    )
                )
            }
            validStartTargetDate = diet.startDate
        }

        let validEndTargetDate = null

        if (data.endDate) {
            if (diet.endDate) {
                validEndTargetDate = scheduler.buildDate({
                    date: diet.endDate,
                    endOfDay: true
                })

                const payloadEndDate = scheduler.buildDate({
                    date: data.endDate,
                    endOfDay: true
                })

                if (payloadEndDate > diet.endDate) {
                    throw new BadRequestException(
                        errorMessagePattern.meal.endDateAfterDietEndDate.fn(
                            scheduler.format(payloadEndDate),
                            scheduler.format(diet.endDate)
                        )
                    )
                }

                if (payloadEndDate < validStartTargetDate) {
                    throw new BadRequestException(
                        errorMessagePattern.meal.endDateBeforeMealStartDate.fn(
                            scheduler.format(payloadEndDate),
                            scheduler.format(validStartTargetDate)
                        )
                    )
                }

                validEndTargetDate = payloadEndDate
            }
        }

        const repeatConfig = data.repeatConfiguration
        let repeatConfigurationPayload: any = {}

        if (!repeatConfig) {
            repeatConfigurationPayload = {
                type: RepeatType.ONCE,
                targetDate: validStartTargetDate
            }
        } else {
            switch (repeatConfig.type) {
                case RepeatType.ONCE:
                    repeatConfigurationPayload.type = RepeatType.ONCE
                    const configTargetDate = repeatConfig.targetDate
                    if (!configTargetDate) {
                        repeatConfigurationPayload.targetDate = validStartTargetDate
                    } else {
                        const scheduledDate = scheduler.buildDate({
                            date: configTargetDate,
                            startOfDay: true
                        })
                        if (scheduledDate < validStartTargetDate) {
                            throw new BadRequestException(
                                errorMessagePattern.meal.targetDateBeforeDietStartDate.fn(
                                    scheduler.format(validStartTargetDate)
                                )
                            )
                        } else if (validEndTargetDate && scheduledDate > validEndTargetDate) {
                            throw new BadRequestException(
                                errorMessagePattern.meal.targetDateAfterDietEndDate.fn(
                                    scheduler.format(validEndTargetDate)
                                )
                            )
                        } else {
                            repeatConfigurationPayload.targetDate = scheduledDate
                        }
                    }
                    break
                case RepeatType.DAILY:
                    repeatConfigurationPayload.type = RepeatType.DAILY
                    repeatConfigurationPayload.repeatTarget = repeatConfig.repeatTarget || 1
                    break
                case RepeatType.WEEKLY:
                    repeatConfigurationPayload.type = RepeatType.WEEKLY
                    const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6]
                    const originalDays = Array.isArray(repeatConfig.daysOfWeek) ? repeatConfig.daysOfWeek : []
                    const filteredDays = originalDays.filter((d: number) => VALID_DAYS.includes(d))
                    const uniqueDaysSet = new Set(filteredDays)
                    if (uniqueDaysSet.size === 0) uniqueDaysSet.add(0)
                    repeatConfigurationPayload.daysOfWeek = [...uniqueDaysSet]
                    repeatConfigurationPayload.repeatTarget = repeatConfig.repeatTarget || 1
                    break
                case RepeatType.MONTHLY:
                    repeatConfigurationPayload.type = RepeatType.MONTHLY
                    const daysOfMonth = repeatConfig.daysOfMonth || []
                    if (daysOfMonth.length === 0) {
                        daysOfMonth.push(validStartTargetDate.getDate())
                    }
                    repeatConfigurationPayload.daysOfMonth = daysOfMonth
                    repeatConfigurationPayload.repeatTarget = repeatConfig.repeatTarget || 1
                    break
                default:
                    throw new BadRequestException(
                        errorMessagePattern.meal.invalidRepeatConfiguration.fn(repeatConfig.type)
                    )
            }
        }

        const hour = data.hour || '00:00'

        return {
            name: data.name,
            description: data.description,
            startDate: validStartTargetDate,
            endDate: validEndTargetDate,
            repeatConfiguration: repeatConfigurationPayload,
            hour
        }
    }
}