import { ApiProperty } from "@nestjs/swagger";
import {
    IsNotEmpty,
    IsString, IsEmail
} from 'class-validator';

export class BodyCreatePatientDto {
    @ApiProperty({
        description: 'Name of the patient',
        required: true,
        example: 'John Doe Patient',
    })
    @IsString()
    @IsNotEmpty({
        message: 'Name must not be empty',
    })
    name: string;

    @ApiProperty({
        description: 'Patient email address',
        example: 'john.doe@patient.com',
        required: true
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Document number (CPF) of the patient',
        required: true,
        example: '000',
        uniqueItems: true,
    })
    @IsString()
    @IsNotEmpty({
        message: 'Document number must not be empty',
    })
    documentNumber: string;
}

export class ProxyBodyCreatePatientDto extends BodyCreatePatientDto {
    @ApiProperty({
        description: 'ID of the nutritionist responsible for the patient',
        required: true,
        example: 'nutritionist-uuid',
    })
    @IsString()
    @IsNotEmpty({
        message: 'Nutritionist ID must not be empty',
    })
    nutritionistId: string;
}