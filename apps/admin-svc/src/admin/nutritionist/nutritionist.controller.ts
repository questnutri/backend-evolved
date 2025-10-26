import { Controller, Body, Post, Inject, UseGuards, UseFilters, Get, Param, Query, Delete } from '@nestjs/common';
import {
    AUTH_SERVICE_PROXY_NAME,
    ControllerExceptionFilter,
    JwtRoleGuard,
    Nutritionist,
    NUTRITIONIST_SERVICE_PROXY_NAME,
    NutritionistManagementLevel,
    ProxyMessage,
    proxyPattern,
    sendProxyMessage,
    User,
    UserRole
} from '@backend-evolved/shared';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ManagementGuard } from '../../guards/management.guard';

type NutriUser = Nutritionist & User;

@Controller('nutritionist')
export class NutritionistController {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(NUTRITIONIST_SERVICE_PROXY_NAME) private readonly nutritionistServiceProxy: ClientProxy
    ) { }

    @Post('approve')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(NutritionistManagementLevel, "canApproveNutritionist")
    )
    @UseFilters(ControllerExceptionFilter)
    async approveNutritionist(@Body('email') email: string) {
        const result = await firstValueFrom(
            this.authServiceProxy.send<ProxyMessage<Nutritionist>, string>('nutritionist.approval', email)
        );
        if (result && "error" in result) throw new RpcException(result);
        return result.payload;
    }

    @Get('all')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(NutritionistManagementLevel, "canViewNutritionists")
    )
    @UseFilters(ControllerExceptionFilter)
    async getAll(
        @Query('approved') approved?: boolean
    ): Promise<NutriUser[]> {
        const userNutritionists = await sendProxyMessage<User[]>(
            {
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.getAll,
                data: approved !== undefined ? { role: UserRole.NUTRITIONIST, active: approved } : { role: UserRole.NUTRITIONIST },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            }
        );

        if (userNutritionists.length === 0) return [];

        const nutritionists = await sendProxyMessage<Nutritionist[]>(
            {
                proxy: this.nutritionistServiceProxy,
                pattern: proxyPattern.nutritionist.getManyByIds,
                data: { ids: userNutritionists.map(u => u.id) },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            }
        );

        return nutritionists.map(nutri => {
            const userData = userNutritionists.find((u: User) => u.id === nutri.id);
            return {
                ...nutri,
                ...userData
            } as NutriUser;
        });
    }

    @Get(':id')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(NutritionistManagementLevel, "canViewNutritionistProfile")
    )
    @UseFilters(ControllerExceptionFilter)
    async getById(
        @Param('id') id: string
    ): Promise<NutriUser> {
        const nutritionist = await sendProxyMessage<Nutritionist>(
            {
                proxy: this.nutritionistServiceProxy,
                pattern: proxyPattern.nutritionist.getById,
                data: { id }
            }
        );

        const userNutritionist = await sendProxyMessage<User>(
            {
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.getOneById,
                data: { id: nutritionist.id },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            }
        );

        return {
            ...nutritionist,
            ...userNutritionist
        } as NutriUser;
    }

    @Delete(':id')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(NutritionistManagementLevel, "canDeleteNutritionist")
    )
    @UseFilters(ControllerExceptionFilter)
    async delete(
        @Param('id') id: string
    ) {
        const foundNutritionist = await sendProxyMessage<Nutritionist>(
            {
                proxy: this.nutritionistServiceProxy,
                pattern: proxyPattern.nutritionist.getById,
                data: { id }
            }
        );

        console.log('Found nutritionist for deletion:', foundNutritionist);

        const userDeletion = await sendProxyMessage<{result: boolean}>(
            {
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.deletionByEmail,
                data: { email: foundNutritionist.email }
            }
        );

        console.log('User deletion result:', userDeletion);

        if(userDeletion.result) {
            const nutritionistDeletion = await sendProxyMessage<{result: boolean}>(
                {
                    proxy: this.nutritionistServiceProxy,
                    pattern: proxyPattern.nutritionist.softDeletionById,
                    data: {id: foundNutritionist.id}
                }
            );
            console.log("Nutritionist deletion result: ", nutritionistDeletion);
            if(nutritionistDeletion.result) {
                return { message: 'Nutritionist deleted successfully', success: true };
            }
        }
        return { message: 'Failed to delete nutritionist', success: false };
    }
}