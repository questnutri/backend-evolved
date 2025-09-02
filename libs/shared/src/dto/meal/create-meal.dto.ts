import { UpdateMealDto } from "./update-meal.dto";
import { InputType } from '@nestjs/graphql';

@InputType()
export class CreateMealDto extends UpdateMealDto {}
