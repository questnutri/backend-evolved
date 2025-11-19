import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { RepeatConfigurationDto } from '../repeat-configuration.dto';

export class CreateMealDto {
    @ApiProperty({
        description: 'Diet ID to which the meal belongs',
        example: 'uuid-of-diet',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    dietId: string;

    @ApiProperty({
        description: 'Meal name',
        example: 'Breakfast'
    })
    @IsOptional()
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


    @ApiPropertyOptional({
        description: `Date that this meal will start to be efective. 
        If not provided: if diet has started, startDate will be equal to request date. 
        Otherwise start date will be equals to diet\'s start date.
        Start date is always set to the beginning of the day (00:00:00) relative to diet timezone.`,
        example: '2025-09-17',
    })
    @IsString()
    @IsOptional()
    startDate: string;

    @ApiPropertyOptional({
        description: `Date of expire of this meal. 
        If not provided endDate will be null and this meal will not expire during the diet's effective period.
        End date is always set to the end of the day (23:59:59) relative to diet timezone.`,
        example: '2025-09-19',
    })
    @IsString()
    @IsOptional()
    endDate: string;
}
