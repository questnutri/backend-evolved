import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateMealDto {
    @ApiProperty({
        description: 'Meal name',
        example: 'Breakfast'
    })
    @IsString()
    @Field()
    name: string;

    @ApiPropertyOptional({
        description: 'Meal description',
        example: 'A high-protein breakfast to start the day',
    })
    @IsOptional()
    @IsString()
    @Field({ nullable: true })
    description?: string;

    @ApiPropertyOptional({
        description: 'Meal hour',
        example: '08:00',
    })
    @IsOptional()
    @IsString()
    @Field({ nullable: true })
    hour?: string;

    @ApiPropertyOptional({
        description: 'Days that this meal will be repeated. Intepretation depends on the diet dayInterpretationMode',
        example: [2, 4, 6],
    })
    @IsOptional()
    @IsNumber({}, { each: true })
    @Field(() => [Number], { nullable: true })
    repeatDays?: number[];
}
