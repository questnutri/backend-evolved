import { RegisterUserDto } from "../auth/register-user.dto";
import { IntersectionType, ApiProperty } from "@nestjs/swagger";
import { 
    IsEnum, 
    IsNotEmpty, 
    IsString, 
    ValidatorConstraint, 
    ValidatorConstraintInterface, 
    ValidationArguments, 
    Validate 
} from 'class-validator';
import { DocumentType } from "../../enums/document-type.enum";
import { LoginUserDto } from "../auth/login-user.dto";


export class CreateNutritionistDto extends IntersectionType(LoginUserDto) {
    @ApiProperty({
        description: 'Name of the nutritionist',
        required: true,
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty({
        message: 'Name must not be empty',
    })
    name: string;

    @ApiProperty({
        description: 'Phone number of the nutritionist',
        required: true,
        example: '+55 11 90000-0000',
    })
    @IsString()
    @IsNotEmpty({
        message: 'Phone number must not be empty',
    })
    phone: string;

    @ApiProperty({
        description: 'CRN of the nutritionist',
        required: true,
        example: 'CRN-3/12345',
    })
    @IsString({
        message: 'CRN must be a string',
    })
    @IsNotEmpty({
        message: 'CRN must not be empty',
    })
    crn: string;

    @ApiProperty({
        description: 'Document type of the nutritionist',
        required: true,
        enum: DocumentType,
        example: DocumentType.CPF,
    })
    @IsEnum(DocumentType, {
        message: `Document type must be a valid type: [${Object.values(DocumentType).join(', ')}]`,
    })
    @IsNotEmpty({
        message: 'Document type must not be empty',
    })
    documentType: DocumentType = DocumentType.CPF;

    @ApiProperty({
        description: 'Document number of the nutritionist, related to the document type',
        required: true,
        example: '000.000.000-00',
        uniqueItems: true,
    })
    @IsString()
    @IsNotEmpty({
        message: 'Document number must not be empty',
    })
    documentNumber: string;
}
