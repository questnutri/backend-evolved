import { ApiProperty } from "@nestjs/swagger";
import {
    IsNotEmpty,
    IsString, IsEmail,
    IsEnum,
    IsOptional
} from 'class-validator';
import { Gender, LevelOfActivity } from "../../enums";

export class BodyCreatePatientDto {
    @ApiProperty({
        description: 'Name of the patient',
        required: true,
        example: 'John Doe Patient',
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the patient',
        required: true,
        example: 'Doe',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

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

    @ApiProperty({
        description: 'Date of birth of the patient',
        required: false,
        example: '1990-01-01',
    })
    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @ApiProperty({
        description: 'Phone number of the patient',
        required: false,
        example: '+55 11 90000-0000',
    })
    @IsOptional()
    @IsString()
    phone?: string;
    
    @ApiProperty({
        description: 'Gender of the patient',
        required: false,
        example: Gender.MALE
    })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender
    
    @ApiProperty({
        description: 'Height of the patient in centimeters',
        required: false,
        example: '170',
    })
    @IsOptional()
    @IsString()
    heightInCm?: string;
    
    
    @ApiProperty({
        description: 'Level of physical activity of the patient',
        required: false,
        example: LevelOfActivity.ONE,
    })
    @IsOptional()
    @IsEnum(LevelOfActivity)
    levelOfActivity?: LevelOfActivity;
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