import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlRoleGuard } from './guards/gql-role.guard';
import { FoodService } from '../food/food.service';
import { MealService } from '../meal/meal.service';
import { CreateFoodDto, Food, UpdateFoodDto } from '@backend-evolved/shared';

@Resolver(() => Food)
export class FoodResolver {
	constructor(private readonly foodService: FoodService, private readonly mealService: MealService) { }

	// @Mutation(() => Food)
	// @UseGuards(GqlRoleGuard(['nutritionist']))
	// async createFood(@Args('mealId') mealId: string, @Args('input') input: CreateFoodDto, @Context() ctx: any) {
	// 	const usedMealId = mealId || (input as any).meal?.id;
	// 	const meal = await this.mealService.findById(usedMealId);
	// 	if (!meal) throw new Error('Meal not found');
	// 	const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
	// 	if (!isRelated) throw new Error("User doesn't have this diet");
	// 	const { quantity, unitOfMeasure } = input;
	// 	const payload: any = { quantity, unitOfMeasure, meal: { id: usedMealId } };
	// 	return await this.foodService.create(payload);
	// }

	@Query(() => [Food])
	@UseGuards(GqlRoleGuard(['nutritionist', 'patient']))
	async getAllFoods(@Args('mealId') mealId: string, @Context() ctx: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new Error('Meal not found');
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) throw new Error('User not allowed to access these foods');
		return await this.foodService.findAll({ meal: { id: mealId } });
	}

	@Query(() => Food, { nullable: true })
	@UseGuards(GqlRoleGuard(['nutritionist', 'patient']))
	async getFood(@Args('mealId') mealId: string, @Args('foodId') foodId: string, @Context() ctx: any) {
		const food = await this.foodService.findById(foodId);
		if (!food) return null;
		const meal = await this.mealService.findById(mealId);
		if (!meal) return null;
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) return null;
		return food;
	}

	@Mutation(() => Food)
	@UseGuards(GqlRoleGuard(['nutritionist']))
	async updateFood(@Args('mealId') mealId: string, @Args('foodId') foodId: string, @Args('input') input: UpdateFoodDto, @Context() ctx: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new Error('Meal not found');
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) throw new Error("User doesn't have this diet");
		const payload: any = { ...input };
		if ((payload as any).mealId) {
			payload.meal = { id: (payload as any).mealId };
			delete payload.mealId;
		}
		return await this.foodService.update(foodId, payload as any);
	}

	@Mutation(() => Boolean)
	@UseGuards(GqlRoleGuard(['nutritionist']))
	async deleteFood(@Args('mealId') mealId: string, @Args('foodId') foodId: string, @Context() ctx: any) {
		const meal = await this.mealService.findById(mealId);
		if (!meal) throw new Error('Meal not found');
		const isRelated = meal.diet.nutritionistId === ctx.req.headers['user-id'] || meal.diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) throw new Error("User doesn't have this diet");
		await this.foodService.delete(foodId);
		return true;
	}
}
