import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator'
import { RepeatType, DayOfWeek } from '../../types/repeat-configuration'

export class RepeatConfigurationDto {
    @ApiProperty({
        enum: RepeatType,
        example: 'WEEKLY'
    })
    @IsEnum(RepeatType)
    type: RepeatType

    @ApiPropertyOptional({
        example: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    repeatTarget?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    targetDate?: string

    @ApiPropertyOptional({
        type: [Number],
        example: [1, 3, 5]
    })
    @IsOptional()
    @IsArray()
    @IsEnum(DayOfWeek, { each: true })
    daysOfWeek?: DayOfWeek[]

    @ApiPropertyOptional({
        type: [Number],
        example: [1, 15, 30]
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @Min(1, { each: true })
    @Max(31, { each: true })
    daysOfMonth?: number[]
}