import { Field, InputType } from "@nestjs/graphql";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

@InputType()
export class UpdateDietDto {
    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Diet name',
        example: 'Bulking Diet - Week 1'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @Field({ nullable: true })
    @ApiPropertyOptional({
        description: 'Diet description',
        example: 'A diet plan for muscle gain',
    })
    @IsOptional()
    @IsString()
    description?: string;

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
