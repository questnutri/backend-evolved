import { Controller, UseFilters, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProxyMessengerFilter, ProxyMessage, Aliment, AlimentSource, proxyPattern } from "@backend-evolved/shared";
import { TacoService } from '../taco/taco.service';
import { HomeMeasureService } from '../home-measure/home-measure.service';
import { SecretAlimentService } from '../secret-aliment/secret-aliment.service';
import { ObjectId } from 'mongodb';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AlimentController {
    constructor(
        private readonly tacoService: TacoService,
        private readonly homeMeasureService: HomeMeasureService,
        private readonly secretService: SecretAlimentService
    ) { }

    @Get('health')
    @ApiExcludeEndpoint()
    getHealthCheck() {
        return { active: true };
    }

    @MessagePattern(proxyPattern.aliment.getById.key)
    @UseFilters(ProxyMessengerFilter)
    async handleGetById(
        @Payload() data: typeof proxyPattern.aliment.getById.payload
    ): Promise<ProxyMessage<typeof proxyPattern.aliment.getById.response>> {
        const id = new ObjectId(data.id);
        let result = null;
        result = await this.tacoService.findOneById(id) || null;
        if (!result) {
            result = await this.homeMeasureService.findOneById(id) || null;
        }
        if (!result) {
            result = await this.secretService.findOneById(id) || null;
        }
        return { payload: result };
    }

    @MessagePattern(proxyPattern.aliment.getManyByIds.key)
    @UseFilters(ProxyMessengerFilter)
    async handleGetManyByIds(
        @Payload() payload: typeof proxyPattern.aliment.getManyByIds.payload
    ): Promise<
        ProxyMessage<typeof proxyPattern.aliment.getManyByIds.response>
    > {
        const objectIds = payload.ids.map(id => new ObjectId(id));
        let results: Aliment[] = [];

        if (!payload.source || payload.source === AlimentSource.TACO) {
            const tacos = await this.tacoService.findManyByIds(objectIds);
            results = results.concat(tacos);
        }
        if (!payload.source || payload.source === AlimentSource.HOME_MEASURE) {
            const home = await this.homeMeasureService.findManyByIds(objectIds);
            results = results.concat(home);
        }
        if (!payload.source || payload.source === AlimentSource.SECRET) {
            const secret = await this.secretService.findManyByIds(objectIds);
            results = results.concat(secret);
        }

        if (payload.source) {
            results = results.filter(a => a.source === payload.source);
        }

        return { payload: results };
    }
}
