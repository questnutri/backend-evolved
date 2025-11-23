import { Controller, Inject, UseFilters } from '@nestjs/common';
import { WeightRecordService } from '../weight-record.service';
import {
    NUTRITIONIST_SERVICE_PROXY_NAME,
    PATIENT_SERVICE_PROXY_NAME,
    ProxyMessage,
    ProxyMessengerFilter,
    proxyPattern,
    sendProxyMessage,
    UserRole
} from '@backend-evolved/shared';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';

//TODO: Add game events!

@Controller()
export class WeightRecordProxyController {
    constructor(
        private readonly weightRecordService: WeightRecordService,
        @Inject(NUTRITIONIST_SERVICE_PROXY_NAME) private readonly nutritionistProxyClient: ClientProxy,
    ) { }

    @MessagePattern(proxyPattern.record.weight.getAll.key)
    @UseFilters(ProxyMessengerFilter)
    async handleFindAll(
        @Payload() payload: typeof proxyPattern.record.weight.getAll.payload
    ): Promise<
        ProxyMessage<typeof proxyPattern.record.weight.getAll.response>
    > {
        const recordList = await this.weightRecordService.findAll({
            ...payload
        });
        return { payload: recordList.items };
    }

    @MessagePattern(proxyPattern.record.weight.getLast.key)
    @UseFilters(ProxyMessengerFilter)
    async handleGetLast(
        @Payload() payload: typeof proxyPattern.record.weight.getLast.payload
    ): Promise<
        ProxyMessage<typeof proxyPattern.record.weight.getLast.response>
    > {
        const lastRecordList = (await this.weightRecordService.findAll({
            patientId: payload.patientId,
            page: 1,
            limit: 1
        }));
        if(lastRecordList.items.length === 0) {
            return { payload: null };
        }

        const lastRecord = lastRecordList.items[0];

        if(lastRecord.registeredBy.role === UserRole.NUTRITIONIST) {
            const nutritionistData = await sendProxyMessage<
                typeof proxyPattern.nutritionist.getById.response,
                typeof proxyPattern.nutritionist.getById.payload
            >({
                proxy: this.nutritionistProxyClient,
                pattern: proxyPattern.nutritionist.getById.key,
                data: { 
                    id: lastRecord.registeredBy.userId
                },
                options: {
                    retry: { count: 5, delay: 50 }
                }
            });
            (lastRecord.registeredBy as any).name = `${nutritionistData.firstName} ${nutritionistData.lastName}`;
        }

        return { payload: lastRecord };
    }
}