import { Field, InputType } from "@nestjs/graphql";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

@InputType()
export class CreateDietDto {
    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Diet name',
        example: 'Bulking Diet - Week 1'
    })
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Diet description',
        example: 'A diet plan for muscle gain',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @Field()
    @ApiProperty({
        description: 'Patient ID',
        example: '',
        required: true
    })
    @IsString()
    patientId: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Date that this date will start to be efective. If not provided, startDate will be equal to request\'s date.',
        example: '2025-09-17T01:44:54.245Z',
    })
    @IsString()
    @IsOptional()
    startDate: Date;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Date of expire of this diet. If not provided endDate will be null and this diet will not expire.',
        example: '2025-09-19T01:44:54.245Z',
    })
    @IsString()
    @IsOptional()
    endDate: Date;

}
