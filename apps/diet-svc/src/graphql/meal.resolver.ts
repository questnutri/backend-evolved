import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlRoleGuard } from './guards/gql-role.guard';
import { MealService } from '../meal/meal.service';
import { DietService } from '../diet/diet.service';
import { Meal, CreateMealDto, UpdateMealDto } from '@backend-evolved/shared';

@Resolver(() => Meal)
export class MealResolver {
	constructor(private readonly mealService: MealService, private readonly dietService: DietService) { }

	@Query(() => [Meal])
	@UseGuards(GqlRoleGuard(['nutritionist', 'patient']))
	async getAllMeals(@Args('dietId') dietId: string) {
		return await this.mealService.findAll({ diet: { id: dietId } });
	}

	@Mutation(() => Meal)
	@UseGuards(GqlRoleGuard(['nutritionist']))
	async createMeal(@Args('dietId') dietId: string, @Args('input', { type: () => CreateMealDto }) input: CreateMealDto, @Context() ctx: any) {
		const diet = await this.dietService.findOne({ id: dietId });
		if (!diet) throw new Error('Diet not found');
		const isRelated = diet.nutritionistId === ctx.req.headers['user-id'] || diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) throw new Error("User doesn't have this diet");
		return await this.mealService.create({ ...input, dietId });
	}

	@Query(() => Meal, { nullable: true })
	@UseGuards(GqlRoleGuard(['nutritionist', 'patient']))
	async getMeal(@Args('mealId') mealId: string, @Context() ctx: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) return null;
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) return null;
		return meal;
	}

	@Mutation(() => Meal)
	@UseGuards(GqlRoleGuard(['nutritionist']))
	async updateMeal(@Args('mealId') mealId: string, @Args('input', { type: () => UpdateMealDto }) input: UpdateMealDto, @Context() ctx: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new Error('Meal not found');
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) throw new Error("User doesn't have this diet");
		return await this.mealService.update(mealId, input as any);
	}

	@Mutation(() => Boolean)
	@UseGuards(GqlRoleGuard(['nutritionist']))
	async deleteMeal(@Args('mealId') mealId: string, @Context() ctx: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new Error('Meal not found');
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) throw new Error("User doesn't have this diet");
		await this.mealService.delete(mealId);
		return true;
	}
}
