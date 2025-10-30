import { Inject, Injectable } from '@nestjs/common';
import { DIET_SERVICE_PROXY_NAME } from '../../../../../libs/shared/src/providers';
import { ClientProxy } from '@nestjs/microservices';
import { proxyPattern, sendProxyMessage } from '../../../../../libs/shared/src/utils';

@Injectable()
export class DietService {
    constructor(
        @Inject(DIET_SERVICE_PROXY_NAME) private readonly dietServiceProxy: ClientProxy,
    ) {}

    async getAll(patientId: string, nutritionistId: string) {
        return await sendProxyMessage({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.getAll,
            data: { patientId, nutritionistId }
        });
    }
}
