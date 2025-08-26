import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateDietDto {
    @ApiProperty({
        description: 'Diet name',
        example: 'Bulking Diet - Week 1'
    })
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Diet description',
        example: 'A diet plan for muscle gain',
    })
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Patient ID',
        example: '',
        required: true
    })
    @IsString()
    patientId: string;

}
