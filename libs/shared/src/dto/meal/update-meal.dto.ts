import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { Meal } from "src/entities";

export class UpdateMealDto {
    @ApiProperty({
        description: 'Meal name',
        example: 'Breakfast'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Meal description',
        example: 'A high-protein breakfast to start the day',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Meal hour',
        example: '08:00',
    })
    @IsOptional()
    @IsString()
    hour?: string;

    @ApiProperty({
        description: 'Days of the week for the meal',
        example: ['Monday', 'Wednesday', 'Friday'],
    })
    @IsOptional()
    @IsString({ each: true })
    daysOfWeek?: string[];
}
