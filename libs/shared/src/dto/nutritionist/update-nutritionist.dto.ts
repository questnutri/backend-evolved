import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";
import { Gender } from "../../enums";

export class UpdateNutritionistDto {
    @ApiProperty({
        description: 'Name of the nutritionist',
        required: false,
        example: 'John Doe',
    })
    @IsString()
    @IsOptional()
    firstName?: string;
    @ApiProperty({
        description: 'Last name of the nutritionist',
        required: false,
        example: 'Doe',
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({
        description: 'Phone number of the nutritionist',
        required: false,
        example: '+55 11 90000-0000',
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({
        description: 'CRN of the nutritionist',
        required: false,
        example: 'CRN-3/12345',
    })
    @IsString()
    @IsOptional()
    crn?: string;

    @ApiProperty({
        description: 'Gender of the nutritionist',
        required: false,
        example: Gender.MALE
    })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender

    @ApiProperty({
        description: 'Main address ID for the nutritionist',
        required: false,
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
    @IsString()
    @IsOptional()
    mainAddress?: string;
}