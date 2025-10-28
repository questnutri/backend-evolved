import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class DietRequestBody {
    @ApiProperty({
        description: 'Patient ID',
        example: 'pat123',
    })
    @IsString()
    patientId!: string;

    @ApiProperty({
        description: 'Nutritionist ID',
        example: 'nutr123',
    })
    @IsString()
    nutritionistId!: string;
}