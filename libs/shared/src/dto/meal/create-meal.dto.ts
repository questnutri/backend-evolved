import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { RepeatConfigurationDto } from '../repeat-configuration.dto';

export class CreateMealDto {
    @ApiProperty({
        description: 'Meal name',
        example: 'Breakfast'
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Meal description',
        example: 'A high-protein breakfast to start the day',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Meal hour',
        example: '08:00',
    })
    @IsOptional()
    @IsString()
    hour?: string;

    @ApiPropertyOptional({
        description: 'Repeat configuration for the meal. If not provided, defaults to ONCE type.',
        example: { type: 'WEEKLY', interval: 1, daysOfWeek: [1, 3, 5] },
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => RepeatConfigurationDto)
    repeatConfiguration?: RepeatConfigurationDto;
}
