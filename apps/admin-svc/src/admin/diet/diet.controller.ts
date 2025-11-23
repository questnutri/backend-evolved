import { Controller, Delete, Get, Inject, Param, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
    JwtRoleGuard,
    DietManagementLevel,
    ControllerExceptionFilter,
    DIET_SERVICE_PROXY_NAME,
    sendProxyMessage,
    proxyPattern
} from "@backend-evolved/shared";

import { ManagementGuard } from '../../guards/management.guard';
import { ClientProxy } from '@nestjs/microservices';

@Controller('diets')
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
        @Query('patientId') patientId: string,
        @Query('nutritionistId') nutritionistId: string,
        @Query('includeMeals') includeMeals: boolean = false,
        @Query('includeFoods') includeFoods: boolean = false,
    ) {
        const where: any = {};
        if (patientId) where.patientId = patientId;
        if (nutritionistId) where.nutritionistId = nutritionistId;
        return await sendProxyMessage<
            typeof proxyPattern.diet.getAll.response,
            typeof proxyPattern.diet.getAll.payload
        >({
            proxy: this.dietProxy,
            pattern: proxyPattern.diet.getAll.key,
            data: {
                where,
                includes: {
                    includeMeals,
                    includeFoods
                }
            }
        })
    }

    @Post(':dietId/activate')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(DietManagementLevel, "canActivateDiet")
    )
    @UseFilters(ControllerExceptionFilter)
    async activateDiet(
        @Param('dietId') dietId: string
    ) {
        return await sendProxyMessage<
            typeof proxyPattern.diet.activate.response,
            typeof proxyPattern.diet.activate.payload
        >({
            proxy: this.dietProxy,
            pattern: proxyPattern.diet.activate.key,
            data: {
                id: dietId
            }
        })
    }

    @Delete(':dietId')
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(DietManagementLevel, "canDeleteDiets")
    )
    @UseFilters(ControllerExceptionFilter)
    async deleteDiet(
        @Param('dietId') dietId: string
    ) {
        return await sendProxyMessage<
            typeof proxyPattern.diet.deleteById.response,
            typeof proxyPattern.diet.deleteById.payload
        >({
            proxy: this.dietProxy,
            pattern: proxyPattern.diet.deleteById.key,
            data: {
                id: dietId
            }
        })
    }
}