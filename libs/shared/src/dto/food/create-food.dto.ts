import { IsOptional, IsString } from "class-validator";
import { UpdateFoodDto } from "./update-food.dto";
import { Field, InputType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";


@InputType()
export class CreateFoodDto {
    @ApiProperty({
        description: 'Aliment unique ID',
        example: '68c9e2b44e99ee1b27d8e3c1'
    })
    @IsString()
    @Field(() => String)
    alimentId: string;

    @ApiPropertyOptional({
        description: 'Quantity for the related portion of that food',
        example: '1'
    })
    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true })
    quantity?: string = '1';

    @ApiPropertyOptional({
        description: 'Reference portion of measurement for the given food quantity',
        example: '100g'
    })
    @IsOptional()
    @Field(() => String, { nullable: true })
    portion?: string = '100g';

    @ApiPropertyOptional({
        description: 'Aditional description for this food',
        example: 'Cut into cubes'
    })
    @IsOptional()
    @Field(() => String, { nullable: true })
    description?: string | null = null;
}