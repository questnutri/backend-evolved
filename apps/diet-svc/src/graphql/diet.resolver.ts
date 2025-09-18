import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlRoleGuard } from './guards/gql-role.guard';
import { DietService } from '../diet/diet.service';
import { CreateDietDto, Diet, UpdateDietDto } from '@backend-evolved/shared';

@Resolver(() => Diet)
export class DietResolver {
	constructor(private readonly dietService: DietService) { }

	// @Mutation(() => Diet)
	// @UseGuards(GqlRoleGuard(['nutritionist']))
	// async createDiet(@Args('input') input: CreateDietDto, @Context() ctx: any) {
	// 	return await this.dietService.createOne({ ...input, nutritionistId: ctx.req.headers['user-id'] });
	// }

	@Query(() => [Diet])
	@UseGuards(GqlRoleGuard(['nutritionist', 'patient']))
	async getAllDiets(@Args('patientId', { nullable: true }) patientId: string, @Args('nutritionistId', { nullable: true }) nutritionistId: string, @Context() ctx: any) {
		const diets = await this.dietService.findAll({ patientId, nutritionistId });
		if (diets.length > 0) {
			const isRelated = diets[0].nutritionistId === ctx.req.headers['user-id'] || diets[0].patientId === ctx.req.headers['user-id'];
			if (isRelated) return diets;
			return [];
		}
		return [];
	}

	@Query(() => Diet, { nullable: true })
	@UseGuards(GqlRoleGuard(['nutritionist', 'patient']))
	async getDiet(@Args('dietId') dietId: string, @Context() ctx: any) {
		const diet = await this.dietService.findOne({ id: dietId });
		if (!diet) return null;
		const isRelated = diet.nutritionistId === ctx.req.headers['user-id'] || diet.patientId === ctx.req.headers['user-id'];
		if (!isRelated) return null;
		return diet;
	}

	// @Mutation(() => Diet)
	// @UseGuards(GqlRoleGuard(['nutritionist']))
	// async updateDiet(@Args('dietId') dietId: string, @Args('input') input: UpdateDietDto) {
	// 	return await this.dietService.updateOne({ id: dietId }, input as any);
	// }

	// @Mutation(() => Boolean)
	// @UseGuards(GqlRoleGuard(['nutritionist']))
	// async deleteDiet(@Args('dietId') dietId: string) {
	// 	await this.dietService.deleteOne({ id: dietId });
	// 	return true;
	// }
}
