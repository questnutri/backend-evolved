import { Aliment, ALIMENT_SERVICE_PROXY_NAME, CreateFoodDto, Food, Meal, ProxyMessage, ServiceContract } from '@backend-evolved/shared';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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
        const {alimentId, ...rest} = food;
        return { ...rest, aliment };
    }

    async findAll(query: { [key in keyof Food]?: any }): Promise<Food[]> {
        const foundValues = await this.foodRepository.find({where: query});
        return Promise.all(foundValues.map(food => this.fetchAliment(food)));
    }

    async findOne(query: { [key in keyof Food]?: any }): Promise<Food | null> {
        if (!query || Object.keys(query).length === 0) return null;
        const found = await this.foodRepository.findOne({ where: query, relations: ['meal'] });
        return found ? this.fetchAliment(found) : null;
    }

    async createOne(data: Partial<Food>): Promise<any> {
        console.log("Creating food with data:", data);
        const food = this.foodRepository.create(data);
        const saved = await this.foodRepository.save(food);
        if (saved) {
            return this.fetchAliment(saved);
        }
        throw new InternalServerErrorException('Failed to create food');
    }

    async updateOne(query: { [key in keyof Food]?: any }, data: Partial<Food>): Promise<Food | null> {
        const entity = await this.foodRepository.findOne({ where: query });
        if (!entity) return null;
        await this.foodRepository.update(entity.id, data);
        return await this.foodRepository.findOne({ where: { id: entity.id } });
    }

    async deleteOne(query: { [key in keyof Food]?: any }): Promise<void> {
        const entity = await this.foodRepository.findOne({ where: query });
        if (entity) {
            await this.foodRepository.delete(entity.id);
        }
    }
}