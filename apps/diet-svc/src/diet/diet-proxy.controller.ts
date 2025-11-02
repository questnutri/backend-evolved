import { Headers, Body, Controller, Get, Post, UseGuards, ForbiddenException, Param, NotFoundException, Put, Delete, UseFilters, Query, BadRequestException } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiQuery,
    ApiBody,
    ApiTags
} from '@nestjs/swagger';
import { DietService } from './diet.service';
import {
    ControllerExceptionFilter,
    CreateDietDto, Diet,
    JwtRoleGuard,
    UpdateDietDto,
    DietPlan,
    ContextUser,
    DietRequestBody,
    ProxyMessengerFilter,
    proxyPattern,
    ProxyMessage,
    toDateOnlyString
} from '@backend-evolved/shared';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
@ApiTags('diets')
@ApiBearerAuth('bearer')
@ApiSecurity('bearer')
export class DietRestController {
    constructor(
        private readonly dietService: DietService,
    ) { }

    private mapDietDates(diet: any): any {
        if (!diet) return diet;
        if (diet.startDate) diet.startDate = toDateOnlyString(diet.startDate);
        if (diet.endDate) diet.endDate = toDateOnlyString(diet.endDate);
        return diet;
    }

    @MessagePattern(proxyPattern.diet.getAll)
    @UseFilters(ProxyMessengerFilter)
    async handleGetAllDiets(
        @Payload() payload: DietRequestBody
    ): Promise<ProxyMessage<Diet[]>> {
        const diets = await this.dietService.findAll({ ...payload });
        return { payload: diets.map(diet => this.mapDietDates(diet)) };
        
    }

}