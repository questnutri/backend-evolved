import { IntersectionType, ApiProperty } from "@nestjs/swagger";
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString
} from 'class-validator';
import { 
    Gender,
    DocumentType
} from "../../enums";
import { LoginUserDto } from "../auth";

export class CreateNutritionistDto extends IntersectionType(LoginUserDto) {
    @ApiProperty({
        description: 'Name of the nutritionist',
        required: true,
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the nutritionist',
        required: true,
        example: 'Doe',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: 'Phone number of the nutritionist',
        required: true,
        example: '+55 11 90000-0000',
    })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        description: 'CRN of the nutritionist',
        required: true,
        example: 'CRN-3/12345',
    })
    @IsString()
    @IsNotEmpty()
    crn: string;

    @ApiProperty({
        description: 'Gender of the nutritionist',
        required: false,
        example: Gender.MALE
    })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender

    @ApiProperty({
        description: 'Document type of the nutritionist',
        required: true,
        enum: DocumentType,
        example: DocumentType.CPF,
    })
    @IsEnum(DocumentType, {
        message: `document type must be a valid type: [${Object.values(DocumentType).join(', ')}]`,
    })
    @IsNotEmpty()
    documentType: DocumentType = DocumentType.CPF;

    @ApiProperty({
        description: 'Document number of the nutritionist, related to the document type',
        required: true,
        example: '000.000.000-00',
        uniqueItems: true,
    })
    @IsString()
    @IsNotEmpty()
    documentNumber: string;
}
