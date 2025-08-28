import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateMealDto {
    @ApiProperty({
        description: 'Meal name',
        example: 'Breakfast'
    })
    @IsOptional()
    @IsString()
    @Field({ nullable: true })
    name?: string;

    @ApiProperty({
        description: 'Meal description',
        example: 'A high-protein breakfast to start the day',
    })
    @IsOptional()
    @IsString()
    @Field({ nullable: true })
    description?: string;

    @ApiProperty({
        description: 'Meal hour',
        example: '08:00',
    })
    @IsOptional()
    @IsString()
    @Field({ nullable: true })
    hour?: string;

    @ApiProperty({
        description: 'Days of the week for the meal',
        example: ['Monday', 'Wednesday', 'Friday'],
    })
    @IsOptional()
    @IsString({ each: true })
    @Field(() => [String], { nullable: true })
    daysOfWeek?: string[];
}
