import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";


export class CreateFoodDto {
    @ApiProperty({
        description: 'Aliment unique ID',
        example: '68c9e2b44e99ee1b27d8e3c1'
    })
    @IsString()
    alimentId: string;

    @ApiPropertyOptional({
        description: 'Quantity for the related portion of that food',
        example: '1'
    })
    @IsString()
    @IsOptional()
    quantity?: string = '1';

    @ApiPropertyOptional({
        description: 'Reference portion of measurement for the given food quantity',
        example: '100g'
    })
    @IsOptional()
    portion?: string = '100g';

    @ApiPropertyOptional({
        description: 'Aditional description for this food',
        example: 'Cut into cubes'
    })
    @IsOptional()
    description?: string | null = null;
}