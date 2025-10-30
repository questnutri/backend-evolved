import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({
        description: 'User current password',
        example: 'currentPassword123',
        required: true
    })
    @IsString()
    currentPassword: string;
    
    @ApiProperty({
        description: 'User new password',
        example: 'newPassword123',
        required: true
    })
    @IsString()
    newPassword: string;
}