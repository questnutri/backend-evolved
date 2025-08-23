import { IntersectionType, ApiProperty } from "@nestjs/swagger";
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    Validate,
    IsEmail
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


export class CreatePatientDto extends IntersectionType(BodyCreatePatientDto) {
    @IsString()
    nutritionistId?: string;
}

