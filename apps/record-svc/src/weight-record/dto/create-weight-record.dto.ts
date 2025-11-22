import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateWeightRecordDto {
    @ApiProperty({
        description: 'Value of the weight record in kilograms',
        example: '70.5',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    valueInKg: string;
}
