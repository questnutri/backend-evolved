import { CreateMealDto, Diet, KeysOf, Meal, ServiceContract } from '@backend-evolved/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MealService implements ServiceContract<Meal> {
    constructor(
        @InjectRepository(Meal)
        private readonly mealRepository: Repository<Meal>
    ) { }

    async findAll(query: { [key in keyof Meal]?: any } = {}) {
        return await this.mealRepository.find({ where: query });
    }

    async findOne(query?: Partial<KeysOf<Meal>>): Promise<Meal | null> {
        if (!query) return null;
        return await this.mealRepository.findOne({ where: query as any, relations: ['diet'] });
    }

    async createOne(data: Partial<Meal>): Promise<Meal> {
        const meal = this.mealRepository.create(data);
        return await this.mealRepository.save(meal);
    }

    async updateOne(query: Partial<KeysOf<Meal>>, data: Partial<Meal>): Promise<Meal | null> {
        const meal = await this.mealRepository.findOne({ where: query as any });
        if (!meal) return null;
        await this.mealRepository.update(meal.id, data);
        return await this.mealRepository.findOne({ where: { id: meal.id } });
    }

    async deleteOne(query: Partial<KeysOf<Meal>>): Promise<void> {
        const meal = await this.mealRepository.findOne({ where: query as any });
        if (!meal) throw new NotFoundException('Meal not found');
        await this.mealRepository.delete(meal.id);
    }

    async create(data: CreateMealDto & {diet: Diet}) {
        const meal = this.mealRepository.create(data);
        return await this.mealRepository.save(meal);
    }

    async findById(id: string) {
        return await this.mealRepository.findOne({ where: { id }, relations: ['diet'] });
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
