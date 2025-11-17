import { Aliment, ALIMENT_SERVICE_PROXY_NAME, Food, getUTCTodayStart, getUTCYesterdayEnd, ProxyMessage, SchedulerHelper, ServiceContract } from '@backend-evolved/shared';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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

    async fetchAliment(food: Food): Promise<any> {
        let aliment;
        if (food.alimentId) {
            const alimentResponse = await firstValueFrom(this.alimentServiceProxy.send<ProxyMessage<Aliment>>('findAlimentById', { id: food.alimentId }));
            if (alimentResponse && "error" in alimentResponse) {
                aliment = null;
            } else {
                aliment = alimentResponse.payload;
            }
        } else {
            aliment = null;
        }
        const { alimentId, ...rest } = food;
        return { ...rest, aliment };
    }

    async findAll(query: { [key in keyof Food]?: any }): Promise<Food[]> {
        const where = { ...query, validTo: null } as any;
        const foundValues = await this.foodRepository.find({ where });
        return Promise.all(foundValues.map(food => this.fetchAliment(food)));
    }

    async findOneWhere(query: { [key in keyof Food]?: any }): Promise<Food | null> {
        if (!query || Object.keys(query).length === 0) return null;
        const where = { ...query, validTo: null } as any;
        const found = await this.foodRepository.findOne({ where, relations: ['meal'] });
        return found ? this.fetchAliment(found) : null;
    }

    async createOne(data: Partial<Food>): Promise<any> {
        let validStartTargetDate = SchedulerHelper.buildDate({ startOfDay: true });
        if(
            (data.meal?.endDate && data.meal?.endDate < validStartTargetDate)
            || 
            (data.meal?.diet.endDate && data.meal?.diet.endDate < validStartTargetDate)
        ) {
            throw new BadRequestException('Cannot add food to a meal or diet that has ended');
        }
        if(validStartTargetDate < data.meal!.startDate!) {
            validStartTargetDate = data.meal!.startDate!;
        }
        const foodData = { ...data, startDate: validStartTargetDate, endDate: null };

        const food = this.foodRepository.create(foodData);
        const saved = await this.foodRepository.save(food);
        if (saved) {
            return this.fetchAliment(saved);
        }
        throw new InternalServerErrorException('Failed to create food');
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