import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProxyMessengerFilter, ProxyMessage, Aliment} from "@backend-evolved/shared";
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
        return {payload: result};
    }
}
