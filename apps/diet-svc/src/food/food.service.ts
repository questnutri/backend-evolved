import { CreateFoodDto, Food, Meal, ServiceContract } from '@backend-evolved/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FoodService implements ServiceContract<Food> {
    constructor(
        @InjectRepository(Food)
        private readonly foodRepository: Repository<Food>,
    ) { }

    async findAll(query: { [key in keyof Food]?: any }): Promise<Food[]> {
        return this.foodRepository.find({ where: query });
    }

    async findOne(query: { [key in keyof Food]?: any }): Promise<Food | null> {
        if (!query || Object.keys(query).length === 0) return null;
        return this.foodRepository.findOne({ where: query , relations: ['meal']});
    }

    async createOne(data: CreateFoodDto & { meal: Meal }): Promise<Food> {
        const food = this.foodRepository.create(data);
        return await this.foodRepository.save(food);
    }

    async updateOne(query: { [key in keyof Food]?: any }, data: Partial<Food>): Promise<Food | null> {
        const entity = await this.foodRepository.findOne({ where: query });
        if (!entity) return null;
        await this.foodRepository.update(entity.id, data);
        return this.foodRepository.findOne({ where: { id: entity.id } });
    }

    async deleteOne(query: { [key in keyof Food]?: any }): Promise<void> {
        const entity = await this.foodRepository.findOne({ where: query });
        if (entity) {
            await this.foodRepository.delete(entity.id);
        }
    }
}