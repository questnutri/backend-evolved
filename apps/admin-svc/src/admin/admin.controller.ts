import { Controller, Body, Post, Inject, ConflictException, InternalServerErrorException, NotFoundException, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AUTH_SERVICE_PROXY_NAME, RoleGuard } from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy
    ) { }

    @Post('approve-nutritionist')
    @UseGuards(RoleGuard(['admin']))
    async approveNutritionist(@Body('email') email: string) {
        try {
            return await firstValueFrom(
                this.authServiceProxy.send<boolean, string>('nutritionist.approval', email)
            );
        } catch (error: any) {
            switch (error.source) {
                case 'ConflictException':
                    throw new ConflictException(error?.detail);
                case 'NotFoundException':
                    throw new NotFoundException('Nutritionist not found for email: ' + email);
                default:
                    console.error('Unexpected error during patient creation:', error);
                    throw new InternalServerErrorException('Failed to create patient: ' + (error?.detail ?? 'unknown'));
            }
        }
    }
}
