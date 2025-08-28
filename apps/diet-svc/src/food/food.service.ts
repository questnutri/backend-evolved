import { Food, ServiceContract } from '@backend-evolved/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FoodService implements ServiceContract<Food> {
    constructor(
        @InjectRepository(Food)
        private readonly foodRepository: Repository<Food>,
    ) { }

    async create(data: Partial<Food>): Promise<Food> {
        return this.foodRepository.save(data);
    }

    async findAll(query: { [key in keyof Food]?: any } = {}): Promise<Food[]> {
        return this.foodRepository.find({ where: query });
    }

    async findById(id: string): Promise<Food | null> {
        return this.foodRepository.findOne({ where: { id } });
    }

    async update(id: string, item: Partial<Food>): Promise<Food | null> {
        await this.foodRepository.update(id, item);
        return this.foodRepository.findOne({ where: { id } });
    }

    async delete(id: string): Promise<void> {
        await this.foodRepository.delete(id);
    }
}
