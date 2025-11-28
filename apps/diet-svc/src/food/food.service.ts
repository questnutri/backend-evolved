import { Aliment, ALIMENT_SERVICE_PROXY_NAME, errorMessagePattern, Food, getUTCTodayStart, getUTCYesterdayEnd, ProxyMessage, proxyPattern, SchedulerHelper, sendProxyMessage, ServiceContract } from '@backend-evolved/shared';
import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class FoodService implements ServiceContract<Food> {
    constructor(
        @InjectRepository(Food)
        private readonly foodRepository: Repository<Food>,
        @Inject(ALIMENT_SERVICE_PROXY_NAME) private readonly alimentServiceProxy: ClientProxy
    ) { }

    async fetchAliment(food: Food): Promise<Food> {
        let aliment;
        if(!food.alimentId) return {...food, aliment: null } as unknown as Food;
        const alimentResponse = await sendProxyMessage<
            ProxyMessage<typeof proxyPattern.aliment.getById.response>,
            typeof proxyPattern.aliment.getById.payload
        >({
            proxy: this.alimentServiceProxy,
            pattern: proxyPattern.aliment.getById.key,
            data: { id: food.alimentId },
            options: {
                retry: {
                    count: 3, delay: 50
                },
                dontThrowIfError: true,
                rawResponse: true
            }
        });
        console.log(alimentResponse);
        if("error" in alimentResponse) {
            aliment = null;
        } else {
            aliment = alimentResponse.payload;
        }
        const { alimentId, ...rest } = food;
        return { ...rest, aliment } as unknown as Food;
    }

    async findAll(query: { [key in keyof Food]?: any }): Promise<Food[]> {
        const where = { ...query, validTo: null } as any;
        const foundValues = await this.foodRepository.find({ where });
        return Promise.all(foundValues.map(food => this.fetchAliment(food)));
    }

    async findOneWhere(where: any = {}, relations: string[] = ['meal']): Promise<Food> {
        const foundFood = await this.foodRepository.findOne({ where, relations });
        if (!foundFood) {
            throw new NotFoundException(errorMessagePattern.food.notFound.key);
        }
        return await this.fetchAliment(foundFood);
    }

    async createOne(data: Partial<Food>, reloadOptions?: { relations?: string[] }): Promise<any> {
        const scheduler = new SchedulerHelper();
        let validStartTargetDate = scheduler.buildDate({ startOfDay: true });
        if (
            (data.meal?.endDate && data.meal?.endDate < validStartTargetDate)
            ||
            (data.meal?.diet.endDate && data.meal?.diet.endDate < validStartTargetDate)
        ) {
            throw new BadRequestException(errorMessagePattern.food.cannotAddToEndedDietOrMeal.fn());
        }
        if (validStartTargetDate < data.meal!.startDate!) {
            validStartTargetDate = data.meal!.startDate!;
        }
        const foodData = { ...data, startDate: validStartTargetDate, endDate: null };

        const food = this.foodRepository.create(foodData);
        let saved = await this.foodRepository.save(food, { reload: true });
        if (saved) {
            if (reloadOptions?.relations) {
                return await this.findOneWhere({ id: saved.id }, reloadOptions.relations);
            }
            return await this.fetchAliment(saved);
        }
        throw new InternalServerErrorException('Failed to create food');
    }

    async clone(food: Food, overrideProperty?: Partial<Food>): Promise<Food> {
        const { id, createdAt, updatedAt, ...rest } = food;
        const clonedFood = this.foodRepository.create({ ...rest, ...(overrideProperty || {}) });
        const savedClonedFood = await this.foodRepository.save(clonedFood, { reload: true });
        return savedClonedFood;
    }

    async cloneMany(foods: Food[], overrideProperty?: Partial<Food>): Promise<Food[]> {
        if (!foods || foods.length === 0) return [];

        const tasks = foods.map(async food => {
            const { id, createdAt, updatedAt, ...rest } = food;
            const cloned = this.foodRepository.create({ ...rest, ...(overrideProperty || {}) });
            return await this.foodRepository.save(cloned, { reload: true });
        });

        const results = await Promise.all(tasks);
        return results;
    }

    async update(food: Food, data: Partial<Food>): Promise<Food> {
        const updatedFood = this.foodRepository.merge(food, data);
        const saved = await this.foodRepository.save(updatedFood);
        return await this.fetchAliment(saved);
    }

    async updateOne(query: { [key in keyof Food]?: any }, data: Partial<Food>): Promise<Food | null> {
        const currentFood = await this.foodRepository.findOne({
            where: { ...query, validTo: null } as any
        });

        if (!currentFood) return null;

        const newValidFrom = getUTCTodayStart();

        if (newValidFrom.getTime() > currentFood!.startDate!.getTime()) {
            const yesterdayEnd = getUTCYesterdayEnd(newValidFrom);

            // Close the current version's effective range
            await this.foodRepository.update(currentFood.id, { endDate: yesterdayEnd });

            // 4. Create a NEW version (temporal record)
            const newFoodData = {
                ...currentFood,
                ...data,
                validFrom: newValidFrom,
                validTo: null,
            };

            const newFood = this.foodRepository.create(newFoodData);
            const saved = await this.foodRepository.save(newFood);

            return this.fetchAliment(saved);
        } else {
            // If `newValidFrom` is the same as `currentFood.validFrom` (e.g., multiple updates on the same day)
            // Just update the existing record fields (not the versioning fields)
            await this.foodRepository.update(currentFood.id, data);
            const updated = await this.foodRepository.findOne({ where: { id: currentFood.id } });
            return updated ? this.fetchAliment(updated) : null;
        }
    }

    async delete(food: Food | Food[]) {
        await this.foodRepository.remove(Array.isArray(food) ? food : [food]);
    }

    async deleteOne(query: { [key in keyof Food]?: any }): Promise<void> {
        const currentFood = await this.foodRepository.findOne({
            where: { ...query, validTo: null } as any
        });

        if (currentFood) {
            const newValidFrom = getUTCTodayStart();

            // Close the current version (effectively "deleting" it from today onwards)
            const yesterdayEnd = getUTCYesterdayEnd(newValidFrom);
            await this.foodRepository.update(currentFood.id, { endDate: yesterdayEnd });
        }
    }
}