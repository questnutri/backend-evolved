import { Controller, UseFilters, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProxyMessengerFilter, ProxyMessage, Aliment, AlimentSource } from "@backend-evolved/shared";
import { TacoService } from '../taco/taco.service';
import { HomeMeasureService } from '../home-measure/home-measure.service';
import { SecretAlimentService } from '../secret-aliment/secret-aliment.service';
import { ObjectId } from 'mongodb';

@Controller()
export class AlimentController {
    constructor(
        private readonly tacoService: TacoService,
        private readonly homeMeasureService: HomeMeasureService,
        private readonly secretService: SecretAlimentService
    ) { }

    @Get('health')
    getHealthCheck() {
        return { active: true };
    }

    @MessagePattern('findAlimentById')
    @UseFilters(ProxyMessengerFilter)
    async findAlimentById(@Payload() data: { id: string; }): Promise<ProxyMessage<Aliment>> {
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

    @MessagePattern('findManyAlimentsByIds')
    @UseFilters(ProxyMessengerFilter)
    async findManyAlimentsByIds(@Payload() payload: { ids: string[], source: AlimentSource | null }): Promise<Aliment[]> {
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

        return results;
    }
}
