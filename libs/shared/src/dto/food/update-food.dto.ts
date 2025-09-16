import { Field, InputType } from "@nestjs/graphql";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

@InputType()
export class UpdateFoodDto {
    @ApiPropertyOptional({
        description: 'Quantity for the related portion of that food',
        example: '1'
    })
    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true })
    quantity?: string;

    @ApiPropertyOptional({
        description: 'Unit of measurement for the food quantity',
        example: '100g'
    })
    @IsOptional()
    @Field(() => String, { nullable: true })
    portion?: string;

    @ApiPropertyOptional({
        description: 'Aditional description for the food',
        example: 'Cut into cubes'
    })
    @IsOptional()
    @Field(() => String, { nullable: true })
    description?: string | null;

    @ApiPropertyOptional({
        description: 'State of the food',
        example: 'false'
    })
    @IsOptional()
    @Field(() => Boolean)
    isActive?: boolean;

}