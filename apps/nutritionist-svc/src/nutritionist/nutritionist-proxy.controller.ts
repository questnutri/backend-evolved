import { Controller, UseFilters } from '@nestjs/common';
import { NutritionistService } from './nutritionist.service';
import {
    ProxyMessage, ProxyMessengerFilter, Nutritionist,
    proxyPattern
} from '@backend-evolved/shared';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class NutritionistProxyController {
    constructor(
        private readonly nutritionistService: NutritionistService,
    ) { }

    @MessagePattern(proxyPattern.nutritionist.getAll)
    @UseFilters(ProxyMessengerFilter)
    async getAll(): Promise<any> {
        return { payload: await this.nutritionistService.findAll() };
    }

    @MessagePattern(proxyPattern.nutritionist.getById)
    @UseFilters(ProxyMessengerFilter)
    async getById(@Payload() payload: { id: string }): Promise<ProxyMessage<Nutritionist>> {
        return { payload: await this.nutritionistService.findOneWhere({ id: payload.id }) };
    }

    @MessagePattern(proxyPattern.nutritionist.getManyByIds)
    @UseFilters(ProxyMessengerFilter)
    async getManyByIds(@Payload() payload: { ids: string[] }): Promise<ProxyMessage<Nutritionist[]>> {
        return { payload: await this.nutritionistService.findManyByIds(payload.ids) };
    }

    @MessagePattern(proxyPattern.nutritionist.softDeletionById)
    @UseFilters(ProxyMessengerFilter)
    async softDeleteOneById(@Payload() payload: { id: string }): Promise<ProxyMessage<{ result: boolean }>> {
        const result = { payload: { result: await this.nutritionistService.softDeleteOneById(payload.id) } };
        return result;
    }
}
