import { Body, Controller, Get, Inject, UseFilters, UseGuards } from '@nestjs/common';
import {
    JwtRoleGuard,
    DietRequestBody,
    DietManagementLevel,
    ControllerExceptionFilter,
    DIET_SERVICE_PROXY_NAME,
    sendProxyMessage,
    Diet,
    proxyPattern
} from "@backend-evolved/shared";

import { ManagementGuard } from '../../guards/management.guard';
import { ClientProxy } from '@nestjs/microservices';

@Controller('diet')
export class DietController {
    constructor(
        @Inject(DIET_SERVICE_PROXY_NAME) private readonly dietProxy: ClientProxy
    ) { }

    @Get()
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(DietManagementLevel, "canViewDiets")
    )
    @UseFilters(ControllerExceptionFilter)
    async getAllDiets(
        @Body() body: DietRequestBody,
    ) {
        return await sendProxyMessage<Diet[]>({
            proxy: this.dietProxy,
            pattern: proxyPattern.diet.getAll,
            data: body
        })
    }

}
