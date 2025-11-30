import {
    ApiProperty,
    ApiPropertyOptional,
    OmitType
} from "@nestjs/swagger";
import {
    IsNotEmpty,
    IsOptional,
    IsString
} from 'class-validator';

export class CreateWaterGoalDto {
    @ApiProperty({
        description: 'Amount of water (in ml) the patient should drink daily',
        example: 2000,
        required: true
    })
    @IsNotEmpty()
    amountInMl: number;

    
    @ApiPropertyOptional({
        description: 'Date that this water goal will start to be efective. If not provided, startDate will be equal to request\'s date.',
        example: '2025-09-17T01:44:54.245Z',
    })
    @IsString()
    @IsOptional()
    startDate: Date;

    @ApiPropertyOptional({
        description: 'Date of expire of this water goal. If not provided endDate will be null and this water goal will not expire.',
        example: '2025-09-19T01:44:54.245Z',
    })
    @IsString()
    @IsOptional()
    endDate: Date;
}


export class ProxyWaterGoalDto extends CreateWaterGoalDto {
    @ApiProperty({
        description: 'ID of the patient for whom the water goal is being created',
        example: 'patient-uuid-1234',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty({
        description: 'ID of the nutritionist creating the water goal',
        required: true,
        example: 'nutritionist-uuid-1234',
    })
    @IsString()
    nutritionistId: string;
}

export class FindCurrentWaterGoalDto extends OmitType(
    ProxyWaterGoalDto,
    ["amountInMl", "startDate", "endDate"] as const
) {
    @ApiPropertyOptional({
        description: "Optional date used to verify which water goal is active",
        example: "2025-09-17T01:44:54.245Z"
    })
    @IsString()
    @IsOptional()
    requestDate?: Date
}