import { CreateMealDto, Meal, ServiceContract } from '@backend-evolved/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MealService implements ServiceContract<Meal> { 
    constructor(
        @InjectRepository(Meal)
        private readonly mealRepository: Repository<Meal>
    ) {}


    async create(data: CreateMealDto) {
        const meal = this.mealRepository.create(data);
        return await this.mealRepository.save(meal);
    }

    async findAll(query: {[key in keyof Meal]?: any} = {}) {
        return await this.mealRepository.find({ where: query });

    }

    async findById(id: string) {
        return await this.mealRepository.findOne({ where: { id } });
    }

    async update(id: string, data: Partial<CreateMealDto>) {
        await this.mealRepository.update(id, data);
        return await this.findById(id);
    }

    async delete(id: string) {
        const foundMeal = await this.findById(id);
        if (!foundMeal) throw new NotFoundException('Meal not found');
        await this.mealRepository.delete(id);
    }
}
