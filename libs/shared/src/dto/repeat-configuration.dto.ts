import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';
import { RepeatType, DayOfWeek } from '../types/repeat-configuration';

export class RepeatConfigurationDto {
    @ApiProperty({
        description: 'Type of repeat pattern',
        enum: RepeatType,
        example: 'WEEKLY'
    })
    @IsEnum(RepeatType)
    type: RepeatType;

    @ApiPropertyOptional({
        description: 'Interval for repetition (every X days/weeks/months)',
        example: 1,
        minimum: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    interval?: number;

    @ApiPropertyOptional({
        description: 'Days of the week (0=Sunday, 1=Monday, etc.)',
        example: [1, 3, 5],
        type: [Number]
    })
    @IsOptional()
    @IsArray()
    @IsEnum(DayOfWeek, { each: true })
    daysOfWeek?: DayOfWeek[];

    @ApiPropertyOptional({
        description: 'Day of the month (1-31) for MONTHLY_DATE type',
        example: 15,
        minimum: 1,
        maximum: 31
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(31)
    dayOfMonth?: number;

    @ApiPropertyOptional({
        description: 'Start date for the repeat pattern (accepts YYYY-MM-DD or full ISO string)',
        example: '2025-09-18'
    })
    @IsOptional()
    @IsDateString()
    startDate?: Date;

    @ApiPropertyOptional({
        description: 'End date for the repeat pattern (accepts YYYY-MM-DD or full ISO string)',
        example: '2025-12-18'
    })
    @IsOptional()
    @IsDateString()
    endDate?: Date;
}
