import {
    Diet,
    PATIENT_SERVICE_PROXY_NAME,
    RECORD_SERVICE_PROXY_NAME,
    ALIMENT_SERVICE_PROXY_NAME,
    Aliment,
    Food,
    SchedulerHelper,
    sendProxyMessage,
    proxyPattern,
    DietStatus,
    errorMessagePattern,
    DietFindOptions,
    DietPlanFindOptions,
    Meal,
    MealRecord
} from '@backend-evolved/shared';
import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { MealService } from '../meal/meal.service';

@Injectable()
export class DietService {
    constructor(
        @InjectRepository(Diet) private readonly dietRepository: Repository<Diet>,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientProxyService: ClientProxy,
        @Inject(RECORD_SERVICE_PROXY_NAME) private readonly recordProxyService: ClientProxy,
        @Inject(ALIMENT_SERVICE_PROXY_NAME) private readonly alimentServiceProxy: ClientProxy,
        private readonly mealService: MealService
    ) { }

    async findAll(options?: DietFindOptions): Promise<Diet[]> {
        let { where, relations, order, includeFoods, includeMeals } = options || {};
        if (!relations) relations = [];
        if (includeMeals) relations.push('meals');
        if (includeFoods) relations.push('meals.foods');
        if (!order) order = {
            createdAt: "DESC",
            startDate: "DESC"
        };

        const foundDiets = await this.dietRepository.find({ where, relations, order });
        if (includeMeals && includeFoods) {
            const fetchedDiets: Diet[] = [];
            for (const diet of foundDiets) {
                fetchedDiets.push(await this.fetchDietAliments(diet));
            }
            return fetchedDiets;
        }
        return foundDiets;
    }

    async findOne(
        find?: DietFindOptions
    ): Promise<Diet> {
        let where: any = {
            ...find?.where,
        }
        const relations = [];
        if (find?.includeMeals) relations.push('meals');
        if (find?.includeFoods) relations.push('meals.foods');
        const foundDiet = await this.dietRepository.findOne({
            where,
            relations
        });

        if (!foundDiet) throw new NotFoundException(errorMessagePattern.diet.notFound.key);
        return foundDiet;
    }

    async createOne(data: Partial<Diet>): Promise<Diet> {
        const scheduler = new SchedulerHelper(data.timeZone);
        const requestDate = scheduler.buildDate({ startOfDay: true });

        const isRelatedToNutritionist = await sendProxyMessage<
            typeof proxyPattern.patient.isRelatedToNutritionist.response,
            typeof proxyPattern.patient.isRelatedToNutritionist.payload
        >({
            proxy: this.patientProxyService,
            pattern: proxyPattern.patient.isRelatedToNutritionist.key,
            data: { patientId: data.patientId!, nutritionistId: data.nutritionistId! }
        })

        if (isRelatedToNutritionist) {
            const disabledPastDateScheduling = process.env.DISABLE_PAST_DATE_SCHEDULING === 'true';
            const validStartDate = scheduler.buildDate({
                date: data.startDate,
                startOfDay: true,
            });
            let validEndDate = null;
            const formatter = (date: Date) => {
                return scheduler.format(date, 'YYYY-MM-DD');
            }
            if (disabledPastDateScheduling) {
                if (data.startDate) {
                    //Checks if startDate is in the past
                    if (validStartDate < requestDate) {
                        throw new BadRequestException(`Diet startDate (${formatter(validStartDate)}) cannot be in the past.`);
                    }
                }
            }
            if (data.endDate) {
                validEndDate = scheduler.buildDate({
                    date: data.endDate,
                    endOfDay: true,
                });
                //Checks if endDate is before startDate
                if (validStartDate > validEndDate) {
                    throw new BadRequestException(`Diet endDate (${formatter(validEndDate)}) cannot be before startDate (${formatter(validStartDate)}).`);
                }
            }

            const diet = this.dietRepository.create({
                ...data,
                startDate: validStartDate,
                endDate: validEndDate
            });
            return await this.dietRepository.save(diet);
        }
        throw new NotFoundException('Patient not found or not related to the nutritionist');
    }

    async clone(
        diet: Diet,
        cloneOptions: {
            includeMeals?: boolean,
            includeFoods?: boolean
            overrideProperties?: Partial<Diet>
        }
    ): Promise<Diet> {
        const { id, createdAt, updatedAt, meals, ...rest } = diet;
        const clonedDiet = this.dietRepository.create({
            ...rest,
            ...cloneOptions.overrideProperties,
            status: DietStatus.DEFINITION
        });
        const savedDiet = await this.dietRepository.save(clonedDiet, { reload: true });
        if (cloneOptions.includeMeals && meals && meals.length > 0) {
            const clonedMeals = await this.mealService.cloneMany(meals, {
                overrideProperties: { diet: savedDiet },
                includeFoods: cloneOptions.includeFoods
            });
            savedDiet.meals = clonedMeals as any;
        }
        return savedDiet;
    }

    async update(diet: Diet, data: Partial<Diet>): Promise<Diet> {
        this.dietRepository.merge(diet, data);
        return await this.dietRepository.save(diet);
    }

    async updateOne(diet: Diet, payload: Partial<Diet>): Promise<Diet> {
        let timeZone = payload.timeZone || diet.timeZone;
        const scheduler = new SchedulerHelper(timeZone);
        const DISABLE_PAST_DATE_SCHEDULING = process.env.DISABLE_PAST_DATE_SCHEDULING === 'true';
        const requestDate = scheduler.startOfDay();

        //Removing unupdatable fields
        const { id, patientId, nutritionistId, meals, createdAt, updatedAt, ...rest } = payload;
        const updatePayload = { ...rest } as Partial<Diet>;

        if (updatePayload.startDate) {
            const sentStartDate = scheduler.buildDate({ date: updatePayload.startDate, startOfDay: true });
            if ( //Checks if diet is active and already started or if set end is before sent date
                diet.status === DietStatus.ACTIVE &&
                (
                    (
                        diet.startDate < requestDate //Diet already started
                    ) ||
                    (
                        //Diet hasn't started but already has a ended date definied. 
                        //This checks if the new start date is after the already set end.   
                        //It's a really rare scenario, but it's possible.
                        diet.endDate && diet.endDate < sentStartDate
                    )
                )
            ) {
                throw new BadRequestException(
                    errorMessagePattern
                        .diet
                        .cannotChangeStartDateOfActiveOrEndedDiet
                        .fn()
                );
            };
            if ( //Here diet HAVE NOT started yet, and sent date is not after a possible end date
                diet.status === DietStatus.ACTIVE &&
                (
                    sentStartDate < requestDate && //New date is in the PAST
                    DISABLE_PAST_DATE_SCHEDULING //Past date scheduling is disabled
                )
            ) {
                throw new BadRequestException(
                    errorMessagePattern
                        .meal
                        .startDateCannotBeInPast
                        .fn(scheduler.format(requestDate, 'YYYY-MM-DD'))
                );
            };
            updatePayload.startDate = scheduler.buildDate({ date: payload.startDate, startOfDay: true });
        }
        if (payload.endDate || payload.endDate === null) {
            if (diet.status === DietStatus.ACTIVE) {
                if (diet.endDate) {
                    if (requestDate > diet.endDate) {
                        throw new BadRequestException(
                            errorMessagePattern
                                .diet
                                .cannotChangeEndDateOfEndedDiet
                                .fn()
                        );
                    }
                }
            }
            if (payload.endDate) {
                const endDate = scheduler.buildDate({ date: payload.endDate, endOfDay: true });
                if (updatePayload.startDate) {
                    if (endDate < updatePayload.startDate) {
                        throw new BadRequestException(
                            errorMessagePattern
                                .diet
                                .cannotSetDietEndDateBeforeStartDate
                                .fn({
                                    endDate: scheduler.format(endDate, 'YYYY-MM-DD'),
                                    startDate: scheduler.format(updatePayload.startDate, 'YYYY-MM-DD')
                                })
                        );
                    }
                    if(scheduler.isSameDate(endDate, updatePayload.startDate, true)) {
                        throw new BadRequestException(
                            errorMessagePattern
                                .diet
                                .cannotEndInSameDayAsStarted
                                .fn({
                                    endDate: scheduler.format(endDate, 'YYYY-MM-DD'),
                                    startDate: scheduler.format(updatePayload.startDate, 'YYYY-MM-DD')
                                })
                        );
                    }
                }
                updatePayload.endDate = endDate;
            }
        }

        this.dietRepository.merge(diet, updatePayload);
        return await this.dietRepository.save(diet);
    }

    async delete(diet: Diet): Promise<void> {
        await this.mealService.delete(diet.meals);
        await this.dietRepository.remove(diet);
    }

    async deleteOne(query: any): Promise<void> {
        const result = await this.dietRepository.delete(query);
        if (result.affected === 0) throw new NotFoundException('Diet not found');
    }

    async getDietPlan(find: DietPlanFindOptions): Promise<any> {
        let { diet, date, length, monthlyView, includeRecords, dontIncludeAliments } = find;
        const scheduler = new SchedulerHelper(diet.timeZone);
        date = scheduler.buildDate({ date: date, startOfDay: true });
        if (!length || length === 0) length = 1;
        else if (length < 0) length *= -1;

        // Calculate the range dates
        let rangeStartDate = scheduler.buildDate({ date, startOfDay: true, offset: { month: -length } });
        let rangeEndDate = scheduler.buildDate({ date, endOfDay: true, offset: { month: +length } });

        // Apply diet boundaries to the range
        let effectiveStartDate = diet.startDate > rangeStartDate ? diet.startDate : rangeStartDate;
        let effectiveEndDate = diet.endDate && diet.endDate < rangeEndDate ? diet.endDate : rangeEndDate;

        // Ensure the diet has meals loaded
        if (!diet.meals || diet.meals.length === 0) {
            return {
                diet: await this.fetchDietAliments(diet),
                plan: []
            };
        };

        if (monthlyView) {
            const monthStart = scheduler.startOfMonth(date);
            const monthEnd = scheduler.endOfMonth(date);
            effectiveStartDate = monthStart > diet.startDate ? monthStart : diet.startDate;
            effectiveEndDate = diet.endDate && diet.endDate < monthEnd ? diet.endDate : monthEnd;
        }

        const start = effectiveStartDate;

        const end = effectiveEndDate;

        const days: Date[] = [];
        const cursor = new Date(start);

        while (cursor <= end) {
            days.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        };

        const dayPlans = await Promise.all(
            days.map(async d => {
                const normalizedDate = scheduler.buildDate({ date: d, startOfDay: true });
                const validMeals = diet.meals.filter((meal: Meal) => meal.isValidForDate(normalizedDate))
                const clonedMeals = validMeals.map((meal: Meal) => ({
                    ...meal,
                    foods: meal.foods.filter(f => f.isValidForDate(normalizedDate))
                })) as Meal[];
                if (!dontIncludeAliments) {
                    await this.injectAlimentsIntoMeals(clonedMeals)
                }
                if (clonedMeals.length === 0) return null;
                const mealPlans = await Promise.all(
                    clonedMeals.map(async (meal: Meal) => {
                        const mealPlan: { meal: Meal; mealRecords?: MealRecord[] } = { meal };

                        if (includeRecords) {
                            try {
                                const response = await sendProxyMessage<
                                    typeof proxyPattern.record.meal.dietRequest.getAllForMealId.response,
                                    typeof proxyPattern.record.meal.dietRequest.getAllForMealId.payload
                                >({
                                    proxy: this.recordProxyService,
                                    pattern: proxyPattern.record.meal.dietRequest.getAllForMealId.key,
                                    data: {
                                        mealId: meal.id,
                                        date: normalizedDate.toISOString(),
                                        timezone: diet.timeZone
                                    },
                                    options: { retry: { count: 2, delay: 50 } }
                                });
                                mealPlan.mealRecords = response || [];
                            } catch (error) {
                                // If fetching records fails, continue with empty records
                                mealPlan.mealRecords = [];
                            }
                        }

                        return mealPlan;
                    })
                );

                return {
                    relativeDate: new Date(normalizedDate),
                    mealPlans
                };
            })
        );

        return {
            diet: !dontIncludeAliments ? await this.fetchDietAliments(diet) : diet,
            plan: dayPlans.filter(p => p !== null)
        };
    }

    async injectAlimentsIntoMeals(meals: any[]): Promise<any[]> {
        const ids: string[] = []
        const positions: { mealIndex: number; foodIndex: number; alimentId: string }[] = []

        meals.forEach((meal, mealIndex) => {
            meal.foods?.forEach((food: Food, foodIndex: number) => {
                if (food.alimentId) {
                    ids.push(food.alimentId)
                    positions.push({ mealIndex, foodIndex, alimentId: food.alimentId })
                }
            })
        })

        let fetched: Aliment[] = []
        if (ids.length > 0) {
            fetched = await sendProxyMessage
                <
                    typeof proxyPattern.aliment.getManyByIds.response,
                    typeof proxyPattern.aliment.getManyByIds.payload
                >
                ({
                    proxy: this.alimentServiceProxy,
                    pattern: proxyPattern.aliment.getManyByIds.key,
                    data: { ids, source: null },
                    options: { retry: { count: 3, delay: 50 } }
                })
        }

        const map = new Map(fetched.map(a => [a._id.toString(), a]))

        positions.forEach(pos => {
            const meal = meals[pos.mealIndex]
            const food = meal.foods[pos.foodIndex]
            const aliment = map.get(pos.alimentId) || null
            food.aliment = aliment
        })

        return meals
    }

    async calculateDietCompliance(diet: Diet): Promise<{
        totalDays: number;
        totalMeals: number;
        completedMeals: number;
        missedMeals: number;
        complianceRate: number;
        dailyCompliance: Array<{
            date: Date;
            totalMeals: number;
            completedMeals: number;
            missedMeals: number;
        }>;
    }> {
        const scheduler = new SchedulerHelper(diet.timeZone);
        const requestDate = scheduler.buildDate({ startOfDay: true });
        const startDate = scheduler.buildDate({ date: diet.startDate, startOfDay: true });

        // Don't calculate if diet hasn't started yet
        if (startDate > requestDate) {
            return {
                totalDays: 0,
                totalMeals: 0,
                completedMeals: 0,
                missedMeals: 0,
                complianceRate: 0,
                dailyCompliance: []
            };
        }

        // Determine end date for compliance calculation (either today or diet end date, whichever is earlier)
        let effectiveEndDate = requestDate;
        if (diet.endDate) {
            const dietEndDate = scheduler.buildDate({ date: diet.endDate, endOfDay: true });
            if (dietEndDate < requestDate) {
                effectiveEndDate = dietEndDate;
            }
        }

        // Build array of days from start to effective end
        const days: Date[] = [];
        const cursor = new Date(startDate);
        while (cursor <= effectiveEndDate) {
            days.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }

        // Ensure diet has meals loaded
        if (!diet.meals || diet.meals.length === 0) {
            return {
                totalDays: days.length,
                totalMeals: 0,
                completedMeals: 0,
                missedMeals: 0,
                complianceRate: 0,
                dailyCompliance: []
            };
        }

        let totalMeals = 0;
        let completedMeals = 0;
        let missedMeals = 0;
        const dailyCompliance: Array<{
            date: Date;
            totalMeals: number;
            completedMeals: number;
            missedMeals: number;
        }> = [];

        // Process each day synchronously
        for (const day of days) {
            const normalizedDate = scheduler.buildDate({ date: day, startOfDay: true });

            // Get valid meals for this day
            const validMeals = diet.meals.filter((meal: Meal) => meal.isValidForDate(normalizedDate));

            if (validMeals.length === 0) {
                continue;
            }

            let dayTotalMeals = validMeals.length;
            let dayCompletedMeals = 0;
            let dayMissedMeals = 0;

            // Fetch records for each meal on this day
            for (const meal of validMeals) {
                try {
                    const records = await sendProxyMessage<
                        typeof proxyPattern.record.meal.dietRequest.getAllForMealId.response,
                        typeof proxyPattern.record.meal.dietRequest.getAllForMealId.payload
                    >({
                        proxy: this.recordProxyService,
                        pattern: proxyPattern.record.meal.dietRequest.getAllForMealId.key,
                        data: {
                            mealId: meal.id,
                            date: normalizedDate.toISOString(),
                            timezone: diet.timeZone
                        },
                        options: { retry: { count: 2, delay: 50 } }
                    });

                    // Check if record exists and is completed
                    if (!records || records.length === 0) {
                        // No record exists - missed meal
                        dayMissedMeals++;
                    } else {
                        // Check if any record is completed
                        const hasCompletedRecord = records.some((record: MealRecord) => record.isCompleted === true);
                        if (hasCompletedRecord) {
                            dayCompletedMeals++;
                        } else {
                            dayMissedMeals++;
                        }
                    }
                } catch (error) {
                    // On error, consider as missed
                    dayMissedMeals++;
                }
            }

            totalMeals += dayTotalMeals;
            completedMeals += dayCompletedMeals;
            missedMeals += dayMissedMeals;

            dailyCompliance.push({
                date: normalizedDate,
                totalMeals: dayTotalMeals,
                completedMeals: dayCompletedMeals,
                missedMeals: dayMissedMeals
            });
        }

        const complianceRate = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 10000) / 100 : 0;

        return {
            totalDays: dailyCompliance.length,
            totalMeals,
            completedMeals,
            missedMeals,
            complianceRate,
            dailyCompliance
        };
    }

    private async fetchDietAliments(diet: Diet): Promise<Diet> {
        const allAlimentIds: string[] = []
        const foodPositions: { mealIndex: number, foodIndex: number, alimentId: string }[] = []

        diet.meals?.forEach((meal, mealIndex) => {
            meal.foods?.forEach((food: Food, foodIndex: number) => {
                if (food.alimentId) {
                    allAlimentIds.push(food.alimentId)
                    foodPositions.push({ mealIndex, foodIndex, alimentId: food.alimentId })
                }
            })
        })

        let fetchedAliments: Aliment[] = []
        if (allAlimentIds.length > 0) {
            fetchedAliments = await sendProxyMessage<
                typeof proxyPattern.aliment.getManyByIds.response,
                typeof proxyPattern.aliment.getManyByIds.payload
            >({
                proxy: this.alimentServiceProxy,
                pattern: proxyPattern.aliment.getManyByIds.key,
                data: {
                    ids: allAlimentIds, source: null
                },
                options: {
                    retry: {
                        count: 3, delay: 50,
                    },
                }
            });
        }

        const alimentMap = new Map(fetchedAliments.map(a => [a._id.toString(), a]))

        foodPositions.forEach(pos => {
            const aliment = alimentMap.get(pos.alimentId)
            const food = diet.meals![pos.mealIndex].foods![pos.foodIndex]
            const { alimentId, ...rest } = food
            diet.meals![pos.mealIndex].foods![pos.foodIndex] = { ...rest, aliment: aliment || null } as any
        })

        return diet
    }

    async fetchDietAlimentsPublic(diet: Diet): Promise<Diet> {
        return await this.fetchDietAliments(diet);
    }
}