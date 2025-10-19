import { Controller, Body, Post, Inject, UseGuards, UseFilters, Get, Param } from '@nestjs/common';
import {
    AUTH_SERVICE_PROXY_NAME,
    ControllerExceptionFilter,
    JwtRoleGuard,
    Nutritionist,
    NUTRITIONIST_SERVICE_PROXY_NAME,
    NutritionistManagementLevel,
    ProxyMessage,
    sendProxyMessage,
    User
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
    ) {}

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
    async getAll(): Promise<NutriUser[]> {
        const nutritionists = await sendProxyMessage<Nutritionist[]>(
            {
                proxy: this.nutritionistServiceProxy,
                pattern: 'nutritionist.getAll',
            }
        );

        if(nutritionists.length === 0) return [];

        const userNutritionists = await sendProxyMessage<User[]>(
            {
                proxy: this.authServiceProxy,
                pattern: 'user.getManyByIds',
                data: { ids: nutritionists.map(n => n.id) },
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
        ManagementGuard(NutritionistManagementLevel, "canViewNutritionists")
    )
    @UseFilters(ControllerExceptionFilter)
    async getById(
        @Param('id') id: string
    ): Promise<NutriUser> {
        const nutritionist = await sendProxyMessage<Nutritionist>(
            {
                proxy: this.nutritionistServiceProxy,
                pattern: 'nutritionist.getById',
                data: id
            }
        );

        const userNutritionist = await sendProxyMessage<User>(
            {
                proxy: this.authServiceProxy,
                pattern: 'user.getOneById',
                data: nutritionist.id,
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

}
