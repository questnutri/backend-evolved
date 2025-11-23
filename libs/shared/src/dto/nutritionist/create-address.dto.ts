import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAddressDto {
    @ApiPropertyOptional({
        description: 'Custom name for the addresss',
        example: 'Home',
        required: false
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'Street name',
        example: 'Rua das Flores'
    })
    @IsString()
    @IsNotEmpty()
    street: string;

    @ApiProperty({
        description: 'Street number',
        example: '123'
    })
    @IsString()
    @IsNotEmpty()
    number: string;

    @ApiPropertyOptional({
        description: 'Complement',
        example: 'Apt 45',
        required: false
    })
    @IsString()
    @IsOptional()
    complement?: string;

    @ApiProperty({
        description: 'Neighborhood',
        example: 'Centro'
    })
    @IsString()
    @IsNotEmpty()
    neighborhood: string;

    @ApiProperty({
        description: 'City',
        example: 'São Paulo'
    })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({
        description: 'State',
        example: 'SP'
    })
    @IsString()
    @IsNotEmpty()
    state: string;

    @ApiProperty({
        description: 'Zip Code',
        example: '01001-000'
    })
    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @ApiPropertyOptional({
        description: 'Country',
        example: 'Brazil',
        required: false
    })
    @IsString()
    @IsOptional()
    country: string;
}