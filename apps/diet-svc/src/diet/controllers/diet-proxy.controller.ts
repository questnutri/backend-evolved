import { Controller, UseFilters } from '@nestjs/common';
import { DietService } from '../diet.service';
import {
    ProxyMessengerFilter,
    proxyPattern,
    ProxyMessage,
    DietStatus
} from '@backend-evolved/shared';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class DietProxyController {
    constructor(
        private readonly dietService: DietService,
    ) { }

    @MessagePattern(proxyPattern.diet.getAll.key)
    @UseFilters(ProxyMessengerFilter)
    async handleGetAllDiets(
        @Payload() payload: typeof proxyPattern.diet.getAll.payload
    ): Promise<ProxyMessage<typeof proxyPattern.diet.getAll.response>> {
        const { where, includes } = payload;
        return {
            payload: await this.dietService.findAll(
                where,
                {
                    includes
                }
            )
        }
    }

    @MessagePattern(proxyPattern.diet.activate.key)
    @UseFilters(ProxyMessengerFilter)
    async handleActivateDiet(
        @Payload() payload: typeof proxyPattern.diet.activate.payload
    ): Promise<ProxyMessage<typeof proxyPattern.diet.activate.response>> {
        return {
            payload: await this.dietService.updateOne({ id: payload.id }, { status: DietStatus.ACTIVE })
        }
    }


}