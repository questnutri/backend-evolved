import { Field, InputType } from "@nestjs/graphql";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsString, IsOptional, IsDateString, IsNumber } from "class-validator";

@InputType()
export class CreateMealRecordDto {
    @Field()
    @ApiProperty({
        description: 'Diet ID that this meal record belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true
    })
    @IsString()
    dietId: string;

    @Field()
    @ApiProperty({
        description: 'Meal ID that this record refers to',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: true
    })
    @IsString()
    mealId: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Patient ID who this meal record belongs to (automatically set from authenticated user)',
        example: '550e8400-e29b-41d4-a716-446655440002'
    })
    @IsString()
    @IsOptional()
    patientId?: string;

    @Field()
    @ApiProperty({
        description: 'Nutritionist ID who created this meal record',
        example: '550e8400-e29b-41d4-a716-446655440003',
        required: true
    })
    @IsString()
    nutritionistId: string;

    @Field()
    @ApiProperty({
        description: 'The relative date when this meal should be consumed',
        example: '2025-09-17T08:00:00.000Z',
        required: true
    })
    @IsDateString()
    mealRelativeDate: Date;

    @Field()
    @ApiProperty({
        description: 'The day number in the diet plan when this meal should be repeated (0 = Sunday, 1 = Monday, etc.)',
        example: 1,
        required: true
    })
    @IsNumber()
    mealRepeatDay: number;
}

// New simplified DTO for patient meal record creation
@InputType()
export class CreatePatientMealRecordDto {
    @Field()
    @ApiProperty({
        description: 'The relative date when this meal should be consumed (only date part, time will be ignored)',
        example: '2025-09-17T08:00:00.000Z',
        required: true
    })
    @IsDateString()
    mealRelativeDate: Date;

    @Field()
    @ApiProperty({
        description: 'The day number in the diet plan when this meal should be repeated (0 = Sunday, 1 = Monday, etc.)',
        example: 1,
        required: true
    })
    @IsNumber()
    mealRepeatDay: number;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Whether the meal has been completed by the patient',
        example: false,
        default: false
    })
    @IsBoolean()
    @IsOptional()
    isCompleted?: boolean = false;
}
