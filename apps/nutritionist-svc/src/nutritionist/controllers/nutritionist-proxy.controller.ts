import { Controller, UseFilters } from '@nestjs/common';
import { NutritionistService } from '../nutritionist.service';
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

    @MessagePattern(proxyPattern.nutritionist.getById.key)
    @UseFilters(ProxyMessengerFilter)
    async getById(
        @Payload() payload: typeof proxyPattern.nutritionist.getById.payload
    ): Promise<ProxyMessage<typeof proxyPattern.nutritionist.getById.response>> {
        return { payload: await this.nutritionistService.findOneWhere({ id: payload.id }) };
    }

    @MessagePattern(proxyPattern.nutritionist.getManyByIds.key)
    @UseFilters(ProxyMessengerFilter)
    async getManyByIds(
        @Payload() payload: typeof proxyPattern.nutritionist.getManyByIds.payload
    ): Promise<
        ProxyMessage<typeof proxyPattern.nutritionist.getManyByIds.response>
    > {
        console.log(payload);
        return { payload: await this.nutritionistService.findManyByIds(payload.ids, payload.options) };
    }

    @MessagePattern(proxyPattern.nutritionist.softDeletionById)
    @UseFilters(ProxyMessengerFilter)
    async softDeleteOneById(@Payload() payload: { id: string }): Promise<ProxyMessage<{ result: boolean }>> {
        const result = { payload: { result: await this.nutritionistService.softDeleteOneById(payload.id) } };
        return result;
    }
}
