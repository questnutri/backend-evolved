import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";
import {
    Gender,
    LevelOfActivity
} from "../../enums";

export class UpdatePatientDto_Patient {
    @ApiProperty({
        description: 'Name of the patient',
        required: false,
        example: 'John Doe Patient',
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({
        description: 'Last name of the patient',
        required: false,
        example: 'Doe',
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({
        description: 'Date of birth of the patient',
        required: false,
        example: '1990-01-01',
    })
    @IsString()
    @IsOptional()
    dateOfBirth?: string;

    @ApiProperty({
        description: 'Phone number of the patient',
        required: false,
        example: '+55 11 90000-0000',
    })
    @IsString()
    @IsOptional()
    phone?: string;
}

export class UpdatePatientDto_Nutritionist extends UpdatePatientDto_Patient {
    @ApiProperty({
        description:
            'Gender of the patient',
        required: false,
        example: Gender.MALE,
    })
    @IsOptional()
    @IsEnum(Gender, {
        message: `gender must be a valid type: [${Object.values(Gender).join(', ')}]`,
    })
    gender?: Gender

    @ApiProperty({
        description: 'Height of the patient in centimeters',
        required: false,
        example: `175`,
    })
    @IsOptional()
    heightInCm?: string;

    @ApiProperty({
        description: 'Level of activity of the patient',
        required: false,
        example: LevelOfActivity.THREE,
    })
    @IsEnum(LevelOfActivity, {
        message: `level of activity must be a valid type: [${Object.values(LevelOfActivity).join(', ')}]`,
    })
    @IsOptional()
    levelOfActivity?: LevelOfActivity;

    @ApiProperty({
        description: 'Water goal of the patient in milliliters',
        required: false,
        example: '2000',
    })
    @IsOptional()
    dailyWaterGoalInMl?: string;
}

export class UpdatePatientNutritionistDto {
    @ApiProperty({
        description: 'Daily water goal of the patient in milliliters',
        required: false,
        example: '2000',
    })
    @IsOptional()
    dailyWaterGoalInMl?: string;

    @ApiProperty({
        description: 'Goals set for the patient by the nutritionist',
        required: false,
        example: 'Lose 5kg in 3 months',
    })
    @IsString()
    @IsOptional()
    goals?: string;

    @ApiProperty({
        description: 'Notes about the patient by the nutritionist',
        required: false,
        example: 'Patient has a history of hypertension.',
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({
        description: 'Medical conditions of the patient',
        required: false,
        example: 'Diabetes, Hypertension',
    })
    @IsString()
    @IsOptional()
    medicalConditions?: string;

    @ApiProperty({
        description: 'Preferences of the patient',
        required: false,
        example: 'Vegetarian, Lactose intolerant',
    })
    @IsString()
    @IsOptional()
    preferences?: string;
}