import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Reset password token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNldEZvciI6IjBkMjdjMjE5LWRkODctNGY3MS1hY2RhLWM2NDhhM2E5ZjE5ZSIsImlhdCI6MTc1NTk3NzM0MCwiZXhwIjoxNzU1OTc3NjQwfQ.4EnLf7X-xQWuFSCczrz5KKuYm-RMxB-5104PSgwAx9E',
        required: true
    })
    @IsString()
    resetPasswordToken: string;

    @ApiProperty({
        description: 'New user password',
        example: 'strongpassword123',
        required: true
    })
    @IsString()
    newPassword: string;
}
