import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        required: true
    })
    @IsEmail()
    email: string;
}
