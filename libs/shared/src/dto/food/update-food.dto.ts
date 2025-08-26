import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateFoodDto {
    @IsString()
    @ApiPropertyOptional({
        description: 'Quantity of food',
        example: '200'
    })
    quantity?: string;

    @ApiPropertyOptional({
        description: 'Unit of measurement for the food quantity',
        example: 'grams'
    })
    unitOfMeasure?: string;

    

}