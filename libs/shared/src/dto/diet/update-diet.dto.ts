import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateDietDto {
    @ApiProperty({
        description: 'Diet name',
        example: 'Bulking Diet - Week 1'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Diet description',
        example: 'A diet plan for muscle gain',
    })
    @IsOptional()
    @IsString()
    description?: string;

}
