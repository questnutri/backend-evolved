import { Field, InputType } from "@nestjs/graphql";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";

@InputType()
export class UpdateFoodDto {
    @ApiPropertyOptional({
        description: 'Quantity of food',
        example: '200'
    })
    @IsString()
    @Field({ nullable: true })
    quantity?: string = '100';

    @ApiPropertyOptional({
        description: 'Unit of measurement for the food quantity',
        example: 'grams'
    })
    @Field({ nullable: true })
    unitOfMeasure?: string = 'grams';
}