import { Field, InputType } from "@nestjs/graphql";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

@InputType()
export class UpdateFoodDto {
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

    @ApiPropertyOptional({
        description: 'State of the food',
        example: 'false'
    })
    @IsOptional()
    @Field(() => Boolean)
    isActive?: boolean;

}