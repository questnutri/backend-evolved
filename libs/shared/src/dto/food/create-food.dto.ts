import { ApiProperty } from "@nestjs/swagger";
import { UpdateFoodDto } from "./update-food.dto";
import { IsString } from 'class-validator'

export class CreateFoodDto extends UpdateFoodDto {
    @ApiProperty({
        description: 'ID of the meal the food belongs to',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsString()
    mealId: string;
}