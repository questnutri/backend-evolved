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
        if(data.repeatDays && data.repeatDays.length === 0) {
            data.repeatDays = [1];
        }
        if(!data.hour) {
            data.hour = '00:00';
        }
        const meal = this.mealRepository.create(data);
        const saved = await this.mealRepository.save(meal);
        // reload with diet relation
        const reloaded = await this.mealRepository.findOne({ where: { id: saved.id }, relations: ['diet'] });
        if (reloaded && reloaded.diet) {
            // remove nested meals to avoid large circular payloads
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            delete reloaded.diet.meals;
        }
        return reloaded as Meal;
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
        if (!data.repeatDays || data.repeatDays.length === 0) {
            data.repeatDays = [1];
        }
        if (data.hour === undefined || data.hour === null || data.hour === '') {
            data.hour = '00:00';
        }

        const meal = this.mealRepository.create(data);
        const saved = await this.mealRepository.save(meal);
        const reloaded = await this.mealRepository.findOne({ where: { id: saved.id }, relations: ['diet'] });
        if (reloaded && reloaded.diet) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            delete reloaded.diet.meals;
        }
        return reloaded as Meal;
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

    // Method for meal record service to get meal information with patient validation
    async getMealInfo(mealId: string, patientId?: string): Promise<{ dietId: string, nutritionistId: string } | null> {
        const meal = await this.mealRepository.findOne({ 
            where: { id: mealId }, 
            relations: ['diet'] 
        });
        
        if (!meal || !meal.diet) {
            return null;
        }

        // If patientId is provided, validate that the patient is assigned to this diet
        if (patientId && meal.diet.patientId !== patientId) {
            return null; // Patient is not assigned to this diet
        }

        return {
            dietId: meal.diet.id,
            nutritionistId: meal.diet.nutritionistId
        };
    }
}
