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

}
