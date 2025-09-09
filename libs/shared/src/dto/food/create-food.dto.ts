import { IsOptional, IsString } from "class-validator";
import { UpdateFoodDto } from "./update-food.dto";
import { Field, InputType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";


@InputType()
export class CreateFoodDto {
    @ApiProperty({
        description: 'Quantity of food',
        example: '200'
    })
    @IsString()
    @Field(() => String)
    alimentId: string;

    @ApiPropertyOptional({
        description: 'Quantity of food',
        example: '200'
    })
    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true })
    quantity?: string = '100';

    @ApiPropertyOptional({
        description: 'Unit of measurement for the food quantity',
        example: 'grams'
    })
    @IsOptional()
    @Field(() => String, { nullable: true })
    unitOfMeasure?: string = 'grams';

    @ApiPropertyOptional({
        description: 'Aditional description for the food',
        example: 'Cut into cubes'
    })
    @IsOptional()
    @Field(() => String, { nullable: true })
    description?: string | null = null;
}