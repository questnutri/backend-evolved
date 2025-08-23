import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        required: true
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'strongpassword123',
        required: true
    })
    @IsString()
    password: string;

}
