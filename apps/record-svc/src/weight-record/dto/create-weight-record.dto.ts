import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWeightRecordDto {
    @ApiProperty({
        description: 'Value of the weight record in kilograms',
        example: '70.5',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    valueInKg: string;

    @ApiPropertyOptional({
        description: 'ID of the patient associated with the weight record',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    })
    @IsOptional()
    @IsString()
    patientId?: string;
}
