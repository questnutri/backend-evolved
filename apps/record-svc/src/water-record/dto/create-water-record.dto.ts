import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class Body_CreateWaterRecord {
    @ApiProperty({
        description: 'Amount of water consumed in milliliters',
        required: true,
        example: 500,
    })
    @IsNotEmpty()
    amountInMl: number;

    @ApiProperty({
        description: 'The relative date and time when the water was consumed',
        required: false,
        example: '2024-06-15T10:30:00Z',
    })
    waterRelativeDate: Date;
}

export class Dto_CreateWaterRecord extends Body_CreateWaterRecord{
    patientId: string;
    waterGoalId: string;
}