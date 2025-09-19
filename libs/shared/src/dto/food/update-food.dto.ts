import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateFoodDto {
    @ApiPropertyOptional({
        description: 'Quantity for the related portion of that food',
        example: '1'
    })
    @IsString()
    @IsOptional()
    quantity?: string;

    @ApiPropertyOptional({
        description: 'Unit of measurement for the food quantity',
        example: '100g'
    })
    @IsOptional()
    portion?: string;

    @ApiPropertyOptional({
        description: 'Aditional description for the food',
        example: 'Cut into cubes'
    })
    @IsOptional()
    description?: string | null;

    @ApiPropertyOptional({
        description: 'State of the food',
        example: 'false'
    })
    @IsOptional()
    isActive?: boolean;

}