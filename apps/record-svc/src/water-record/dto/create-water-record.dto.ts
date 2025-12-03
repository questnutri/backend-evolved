import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { RecordType } from "@backend-evolved/shared";

export class Body_CreateWaterRecord {
    @ApiProperty({
        description: 'Amount of water consumed in milliliters',
        required: true,
        example: 500,
    })
    @IsNotEmpty()
    amountInMl: string;

    @ApiPropertyOptional({
        description: 'Operation type: ADD to add water intake, SUB to subtract water intake',
        required: false,
        example: RecordType.ADD,
    })
    @IsOptional()
    @IsEnum(RecordType)
    operation: RecordType;
}

export class Dto_CreateWaterRecord extends Body_CreateWaterRecord{
    patientId: string;
    waterGoalId: string;
}