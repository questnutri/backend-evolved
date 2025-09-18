import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { InputType, Field } from '@nestjs/graphql';
import { CreateMealDto } from "./create-meal.dto";

@InputType()
export class UpdateMealDto extends CreateMealDto {

}
