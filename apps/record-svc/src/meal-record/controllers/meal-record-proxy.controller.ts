import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { MealRecordService } from '../meal-record.service';
import {
    proxyPattern,
    DietStatus,
    SchedulerHelper,
    sendProxyMessage,
    DIET_SERVICE_PROXY_NAME,
    ProxyMessage
} from '@backend-evolved/shared';

@Controller()
export class MealRecordProxyController {
    constructor(
        private readonly mealRecordService: MealRecordService,
        @Inject(DIET_SERVICE_PROXY_NAME) private readonly dietServiceProxy: ClientProxy
    ) { }

    @MessagePattern(proxyPattern.record.meal.getAllForMealId.key)
    async handleGetAllForMealId(
        @Payload() payload: typeof proxyPattern.record.meal.getAllForMealId.payload
    ): Promise<
        ProxyMessage<
            typeof proxyPattern.record.meal.getAllForMealId.response
        >
    > {
        const foundMeal = await sendProxyMessage<
            typeof proxyPattern.diet.meal.getOne.response,
            typeof proxyPattern.diet.meal.getOne.payload
        >({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.meal.getOne.key,
            data: {
                mealId: payload.mealId,
                patientId: payload.patientId,
                dietStatus: DietStatus.ACTIVE
            }
        });
        const scheduler = new SchedulerHelper(foundMeal.diet.timeZone);
        const findOptions: any = {
            mealId: foundMeal.id,
        };

        if (payload.date) {
            const targetDate = scheduler.buildDate({ date: payload.date, startOfDay: true });
            findOptions['relativeDate'] = targetDate;
        }

        return { payload: await this.mealRecordService.findAll(findOptions) };
    }

    @MessagePattern(proxyPattern.record.meal.dietRequest.getAllForMealId.key)
    async handleGetAllForMealIdForValidatedDiet(
        @Payload() payload: typeof proxyPattern.record.meal.dietRequest.getAllForMealId.payload
    ): Promise<
        ProxyMessage<
            typeof proxyPattern.record.meal.dietRequest.getAllForMealId.response
        >
    > {
        console.log('Payload received in meal record proxy:', payload);
        const scheduler = new SchedulerHelper(payload.timezone);
        const findOptions: any = {
            mealId: payload.mealId,
        };

        if (payload.date) {
            const targetDate = scheduler.buildDate({ date: payload.date, startOfDay: true });
            findOptions['relativeDate'] = targetDate;
        }


        return { payload: await this.mealRecordService.findAll(findOptions) };
    }

}
