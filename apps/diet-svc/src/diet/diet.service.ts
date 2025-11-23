import {
    Diet,
    PATIENT_SERVICE_PROXY_NAME,
    RECORD_SERVICE_PROXY_NAME,
    ALIMENT_SERVICE_PROXY_NAME,
    ServiceContract,
    Aliment,
    Food,
    SchedulerHelper,
    sendProxyMessage,
    proxyPattern,
    DietStatus,
    errorMessagePattern,
    DietIncludeOptions
} from '@backend-evolved/shared';
import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MealService } from '../meal/meal.service';

@Injectable()
export class DietService implements ServiceContract<Diet> {
    constructor(
        @InjectRepository(Diet) private readonly dietRepository: Repository<Diet>,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientProxyService: ClientProxy,
        @Inject(RECORD_SERVICE_PROXY_NAME) private readonly recordProxyService: ClientProxy,
        @Inject(ALIMENT_SERVICE_PROXY_NAME) private readonly alimentServiceProxy: ClientProxy,
        private readonly mealService: MealService
    ) { }

    async findAll(where?: any, options?: {
        includes?: DietIncludeOptions
    }): Promise<Diet[]> {
        const relations = [];
        if (options?.includes?.includeMeals) relations.push('meals');
        if (options?.includes?.includeFoods) relations.push('meals.foods');
        const foundDiets = await this.dietRepository.find({ where, relations });
        if (options?.includes?.includeFoods) {
            const fetchedDiets: Diet[] = [];
            for (const diet of foundDiets) {
                fetchedDiets.push(await this.fetchDietAliments(diet));
            }
            return fetchedDiets;
        }
        return foundDiets;
    }

    //TODO: FINISH DIET PLAN

    async findOneWhere(where: any, relations: string[] = ['meals', 'meals.foods']): Promise<Diet> {
        const foundDiet = await this.dietRepository.findOne({ where, relations });
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

    async updateOne(query: any, payload: Partial<Diet>): Promise<Diet> {
        const foundDiet = await this.findOneWhere(query);
        const scheduler = new SchedulerHelper(foundDiet.timeZone);
        const DISABLE_PAST_DATE_SCHEDULING = process.env.DISABLE_PAST_DATE_SCHEDULING === 'true';
        const requestDate = scheduler.startOfDay();

        //Removing unupdatable fields
        const { id, patientId, nutritionistId, meals, createdAt, updatedAt, ...rest } = payload;
        const updatePayload = { ...rest } as Partial<Diet>;

        if (updatePayload.startDate) {
            const sentStartDate = scheduler.buildDate({ date: updatePayload.startDate, startOfDay: true });
            if ( //Checks if diet is active and already started or if set end is before sent date
                foundDiet.status === DietStatus.ACTIVE &&
                (
                    (
                        foundDiet.startDate < requestDate //Diet already started
                    ) ||
                    (
                        //Diet hasn't started but already has a ended date definied. 
                        //This checks if the new start date is after the already set end.   
                        //It's a really rare scenario, but it's possible.
                        foundDiet.endDate && foundDiet.endDate < sentStartDate
                    )
                )
            ) {
                throw new BadRequestException(
                    errorMessagePattern
                        .diet
                        .cannotChangeStartDateOfActiveOrEndedDiet
                        .key
                );
            };
            if ( //Here diet HAVE NOT started yet, and sent date is not after a possible end date
                foundDiet.status === DietStatus.ACTIVE &&
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
        }
        //TODO: Validate endDate changes too

        this.dietRepository.merge(foundDiet, updatePayload);
        return await this.dietRepository.save(foundDiet);
    }

    async delete(diet: Diet): Promise<void> {
        await this.mealService.delete(diet.meals);
        await this.dietRepository.remove(diet);
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
}