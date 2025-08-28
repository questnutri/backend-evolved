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

}
