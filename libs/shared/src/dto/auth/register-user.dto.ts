import { ApiProperty } from "@nestjs/swagger";
import { LoginUserDto } from "./login-user.dto";
import { UserRole } from "../../enums";
import { IsEnum } from "class-validator";

export class RegisterUserDto extends LoginUserDto {
    @ApiProperty({
        description: 'Role of the user',
        example: UserRole.NUTRITIONIST,
        required: true
    })
    @IsEnum(UserRole)
    role: UserRole;
}


