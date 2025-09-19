import { Field, InputType } from "@nestjs/graphql";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsString, IsOptional, IsDateString } from "class-validator";

@InputType()
export class UpdateMealRecordDto {
    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Diet ID that this meal record belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    @IsString()
    @IsOptional()
    dietId?: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Meal ID that this record refers to',
        example: '550e8400-e29b-41d4-a716-446655440001'
    })
    @IsString()
    @IsOptional()
    mealId?: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Patient ID who this meal record belongs to',
        example: '550e8400-e29b-41d4-a716-446655440002'
    })
    @IsString()
    @IsOptional()
    patientId?: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Nutritionist ID who created this meal record',
        example: '550e8400-e29b-41d4-a716-446655440003'
    })
    @IsString()
    @IsOptional()
    nutritionistId?: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Whether the meal has been completed by the patient',
        example: true
    })
    @IsBoolean()
    @IsOptional()
    isCompleted?: boolean;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'The relative date when this meal should be consumed',
        example: '2025-09-17T08:00:00.000Z'
    })
    @IsDateString()
    @IsOptional()
    mealRelativeDate?: Date;
}
