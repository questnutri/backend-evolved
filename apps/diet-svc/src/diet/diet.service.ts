import { Diet, PATIENT_SERVICE_PROXY_NAME, RECORD_SERVICE_PROXY_NAME, ALIMENT_SERVICE_PROXY_NAME, ServiceContract, MealRecord, Aliment, Food, MealRepeatCalculator, RepeatType, SchedulerHelper, sendProxyMessage, proxyPattern } from '@backend-evolved/shared';
import { DietPlan, DietDayPlan, MealPlan, CleanedMealRecord } from '@backend-evolved/shared';
import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DietService implements ServiceContract<Diet> {
    constructor(
        @InjectRepository(Diet) private readonly dietRepository: Repository<Diet>,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientProxyService: ClientProxy,
        @Inject(RECORD_SERVICE_PROXY_NAME) private readonly recordProxyService: ClientProxy,
        @Inject(ALIMENT_SERVICE_PROXY_NAME) private readonly alimentServiceProxy: ClientProxy
    ) { }

    async findAll(query: { [key in keyof Diet]?: any }): Promise<Diet[]> {
        return await this.dietRepository.find({ where: query });
    }

    async findOneWhere(where: any, relations: string[] = ['meals', 'meals.foods']): Promise<Diet> {
        const foundDiet = await this.dietRepository.findOne({ where, relations });
        if (!foundDiet) throw new NotFoundException('Diet not found or not related to user');
        return foundDiet;
    }

    async createOne(data: Partial<Diet>): Promise<Diet> {
        const scheduler = new SchedulerHelper(data.timeZone);
        const requestDate = scheduler.buildDate({ startOfDay: true });

        const isRelatedToNutritionist = await sendProxyMessage<
            typeof proxyPattern.patient.isRelatedToNutritionist.receive,
            typeof proxyPattern.patient.isRelatedToNutritionist.send
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
                return scheduler.formatDate(date, 'YYYY-MM-DD');
            }
            if (disabledPastDateScheduling) {
                if (data.startDate) {
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

    async updateOne(query: any, data: Partial<Diet>): Promise<Diet> {
        const diet = await this.dietRepository.findOne({ where: query });
        if (!diet) {
            throw new NotFoundException('Diet not found');
        }
        this.dietRepository.merge(diet, data);
        return await this.dietRepository.save(diet);
    }

    async deleteOne(query: any): Promise<void> {
        const result = await this.dietRepository.delete(query);
        if (result.affected === 0) throw new NotFoundException('Diet not found');
    }

    async getDietPlan(diet: Diet, date?: string, length: number = 1): Promise<any> {
        const scheduler = new SchedulerHelper(diet.timeZone);
        if (length === 0) length = 1;
        else if (length < 0) length *= (-1);

        const requestDate = scheduler.buildDate({ date, startOfDay: true });
        const startDate = scheduler.buildDate({ date, startOfDay: true, offset: { month: -length } });
        const endDate = scheduler.buildDate({ date, startOfDay: true, offset: { month: +length } });

        console.log(`Request Date: ${requestDate}`);
        console.log(`Start Date: ${startDate}`);
        console.log(`End Date: ${endDate}`);

    }

    /**
     * Fetch aliment information for all foods in a diet
     */
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
            fetchedAliments = await firstValueFrom(
                this.alimentServiceProxy.send<Aliment[]>('findManyAlimentsByIds', { ids: allAlimentIds, source: null })
            )
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

    /**
     * Public method to fetch aliment information for all foods in a diet
     */
    async fetchDietAlimentsPublic(diet: Diet): Promise<Diet> {
        return await this.fetchDietAliments(diet);
    }

    /**
     * Fetch all meal records for a patient within a specific date range
     * This is done once per diet plan generation to avoid N+1 queries
     */
    private async fetchMealRecordsForRange(patientId: string, startDate: Date, endDate: Date): Promise<MealRecord[]> {
        try {
            const mealRecords = await firstValueFrom(
                this.recordProxyService.send<MealRecord[]>('meal-record.findByPatientAndDateRange', {
                    patientId,
                    startDate: this.normalizeToStartOfDay(startDate),
                    endDate: this.normalizeToStartOfDay(endDate)
                })
            );
            return mealRecords || [];
        } catch (error) {
            console.warn('Failed to fetch meal records:', error);
            return [];
        }
    }

    /**
     * Normalize date to start of day (00:00:00) to ignore hours in UTC
     */
    private normalizeToStartOfDay(date: Date): Date {
        const normalized = new Date(date);
        normalized.setUTCHours(0, 0, 0, 0);
        return normalized;
    }

    /**
     * Generate diet plans for a patient within a specific date range
     * Default range: current month, one month back, one month forward
     */
    async getDietPlanForPatient(patientId: string, nutritionistId: string, length: number = 1): Promise<DietPlan[]> {
        const currentDate = new Date();

        // Calculate date range based on length (in months) - normalize to start of day
        const startDate = this.normalizeToStartOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() - length, 1));
        const endDate = this.normalizeToStartOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + length + 1, 0));

        console.log(`[DEBUG] getDietPlanForPatient: currentDate=${currentDate.toISOString()}, length=${length}`);
        console.log(`[DEBUG] getDietPlanForPatient: calculated startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);

        // Get all diets for the patient within the date range
        const diets = await this.dietRepository.find({
            where: {
                patientId,
                nutritionistId,
                startDate: Between(startDate, endDate)
            },
            relations: ['meals', 'meals.foods']
        });

        console.log(`[DEBUG] Found ${diets.length} diets for patient ${patientId}`);
        if (diets.length > 0) {
            console.log(`[DEBUG] Diet startDates: ${diets.map(d => d.startDate.toISOString()).join(', ')}`);
        }

        const dietPlans: DietPlan[] = [];

        for (const diet of diets) {
            // Fetch aliments for all foods in this diet
            const dietWithAliments = await this.fetchDietAliments(diet);
            const dietPlan = await this.generateDietPlan(dietWithAliments, startDate, endDate, patientId);
            dietPlans.push(dietPlan);
        }

        return dietPlans;
    }

    /**
     * Generate a single diet plan from a diet entity
     */
    private async generateDietPlan(diet: Diet, rangeStart: Date, rangeEnd: Date, patientId: string): Promise<DietPlan> {
        const dayPlans: DietDayPlan[] = [];

        // Fetch all meal records for the patient within the date range for efficiency
        const mealRecords = await this.fetchMealRecordsForRange(patientId, rangeStart, rangeEnd);

        // Determine the effective date range for this diet - normalize to start of day
        const dietStart = this.normalizeToStartOfDay(diet.startDate > rangeStart ? diet.startDate : rangeStart);
        const dietEnd = this.normalizeToStartOfDay(diet.endDate && diet.endDate < rangeEnd ? diet.endDate : rangeEnd);

        // Generate day plans for each day in the range
        // Use ms-based increment to avoid local timezone/setDate pitfalls
        let currentDate = new Date(dietStart);
        while (currentDate <= dietEnd) {
            const normalizedCurrentDate = this.normalizeToStartOfDay(currentDate);
            const dayPlan = await this.generateDayPlan(diet, normalizedCurrentDate, patientId, mealRecords);
            if (dayPlan.mealPlans.length > 0) {
                dayPlans.push(dayPlan);
            }
            // increment by exact 24h in UTC ms to avoid DST/local offset shifts
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        }

        return {
            dietId: diet.id,
            plan: dayPlans
        };
    }

    /**
     * Generate a day plan for a specific date
     */
    private async generateDayPlan(diet: Diet, targetDate: Date, patientId: string, mealRecords: MealRecord[] = []): Promise<DietDayPlan> {
        const mealPlans: MealPlan[] = [];
        const normalizedTargetDate = this.normalizeToStartOfDay(targetDate);
        const normalizedDietStartDate = this.normalizeToStartOfDay(diet.startDate);

        for (const meal of diet.meals || []) {
            if (!meal.isActive) {
                continue;
            }

            // Provide default repeat configuration if none exists (for backward compatibility)
            let mealRepeatConfig = meal.repeatConfiguration;
            if (!mealRepeatConfig) {
                mealRepeatConfig = {
                    type: RepeatType.DAILY,
                    startDate: normalizedDietStartDate,
                    repeatTarget: 1
                };
            }

            // Normalize meal.repeatConfiguration.startDate to UTC start-of-day if present,
            // otherwise use diet start date. This ensures the repeat calculator gets a UTC date-only start.
            const repeatStartDate = mealRepeatConfig.startDate
                ? this.normalizeToStartOfDay(new Date(mealRepeatConfig.startDate))
                : normalizedDietStartDate;
            mealRepeatConfig = { ...mealRepeatConfig, startDate: repeatStartDate };

            // Use new flexible repeat calculation
            const dietDays = diet.endDate ?
                Math.floor((diet.endDate.getTime() - normalizedDietStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 :
                365; // Default to 1 year if no end date

            // For ONCE meals, use the meal's own startDate from repeatConfiguration
            // For other types, use the diet's startDate as before
            // Pass the normalized repeatStartDate so calculations are anchored correctly
            const shouldSchedule = MealRepeatCalculator.shouldMealBeScheduled(
                mealRepeatConfig,
                normalizedTargetDate,
                repeatStartDate,
                dietDays
            );

            if (shouldSchedule) {
                // Find the meal record for this meal and date
                const mealRecord = this.findMealRecordInList(meal.id, patientId, normalizedTargetDate, mealRecords);

                const mealPlan: MealPlan = {
                    meal,
                    mealRecord: mealRecord ? this.cleanMealRecord(mealRecord) : null
                };
                mealPlans.push(mealPlan);
            }
        }

        return {
            relativeDate: normalizedTargetDate,
            mealPlans
        };
    }

    /**
     * Clean meal record by removing redundant fields that are already available in other parts of the plan
     */
    private cleanMealRecord(mealRecord: MealRecord): CleanedMealRecord {
        return {
            id: mealRecord.id,
            createdAt: mealRecord.createdAt,
            updatedAt: mealRecord.updatedAt,
            isCompleted: mealRecord.isCompleted,
            mealRelativeDate: mealRecord.mealRelativeDate,
        };
    }

    /**
     * Find a meal record in a pre-fetched list for a specific meal and date
     */
    private findMealRecordInList(mealId: string, patientId: string, targetDate: Date, mealRecords: MealRecord[]): MealRecord | null {
        const normalizedTargetDate = this.normalizeToStartOfDay(targetDate);

        return mealRecords.find(record => {
            if (record.mealId !== mealId || record.patientId !== patientId) {
                return false;
            }

            const recordDate = this.normalizeToStartOfDay(new Date(record.mealRelativeDate));
            return recordDate.getTime() === normalizedTargetDate.getTime();
        }) || null;
    }

}
