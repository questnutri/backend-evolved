import { ApiProperty } from "@nestjs/swagger";
import { UpdateMealDto } from "./update-meal.dto";

export class CreateMealDto extends UpdateMealDto {
    @ApiProperty({
        description: 'ID of the diet this meal belongs to',
        example: 'diet123',
        required: true
    })
    dietId: string;
}
