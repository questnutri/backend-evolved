import { BadRequestException, Controller, UseFilters } from '@nestjs/common';
import { DietService } from '../diet.service';
import {
    ProxyMessengerFilter,
    proxyPattern,
    ProxyMessage,
    DietStatus,
    errorMessagePattern,
    SchedulerHelper
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
        let { where, includes } = payload;
        return {
            payload: await this.dietService.findAll({
                where,
                ...includes
            })
        }
    }

    @MessagePattern(proxyPattern.diet.activate.key)
    @UseFilters(ProxyMessengerFilter)
    async handleActivateDiet(
        @Payload() payload: typeof proxyPattern.diet.activate.payload
    ): Promise<ProxyMessage<typeof proxyPattern.diet.activate.response>> {
        const foundDiet = await this.dietService.findOne({ where: { id: payload.id } });
        return {
            payload: await this.dietService.updateOne(foundDiet, { status: DietStatus.ACTIVE })
        }
    }

    @MessagePattern(proxyPattern.diet.deleteById.key)
    @UseFilters(ProxyMessengerFilter)
    async handleDeleteDietById(
        @Payload() payload: typeof proxyPattern.diet.deleteById.payload
    ): Promise<
        ProxyMessage<typeof proxyPattern.diet.deleteById.response>
    > {
        const foundDiet = await this.dietService.findOne({
            where: { id: payload.id },
            relations: ['meals', 'meals.foods']
        });
        const scheduler = new SchedulerHelper(foundDiet.timeZone);
        if (foundDiet.endDate && foundDiet.endDate < scheduler.startOfDay()) {
            throw new BadRequestException(
                errorMessagePattern
                    .diet
                    .cannotDeleteEndedDiet
                    .key
            );
        }
        if (foundDiet.status === DietStatus.DEFINITION) {
            await this.dietService.delete(foundDiet);
        } else {
            const requestDate = scheduler.startOfDay();
            if (scheduler.isSameDate(foundDiet.startDate, requestDate, true)) {
                await this.dietService.delete(foundDiet);
            } else {
                await this.dietService.update(foundDiet, { endDate: scheduler.endOfDay() });
            }
        }
        return { payload: { result: true } };
    }

    @MessagePattern(proxyPattern.diet.getDietPlanForDay.key)
    async handleGetDietPlanForDay(
        @Payload() payload: typeof proxyPattern.diet.getDietPlanForDay.payload
    ): Promise<ProxyMessage<typeof proxyPattern.diet.getDietPlanForDay.response>> {
        return {
            payload: await this.dietService.getDietPlanForDay(payload.dietId, payload.date)
        };
    }


}