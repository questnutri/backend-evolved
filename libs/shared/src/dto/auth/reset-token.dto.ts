import { ApiProperty, ApiPropertyOptional} from '@nestjs/swagger'

export class ResetTokenDto {
    @ApiProperty({
        description: 'The reset token to be used for resetting the user password',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        required: true
    })
    resetPassword: string

    @ApiPropertyOptional({
        description: 'Declares if the reset token reason is first login on app',
    })
    firstLogin?: boolean
}