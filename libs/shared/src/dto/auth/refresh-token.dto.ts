import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RefreshTokenDto {
    @ApiProperty({
        description: 'The refresh token to be used for refreshing the authentication token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        required: true
    })
    @IsString()
    refreshToken: string
}