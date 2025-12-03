import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    UseFilters,
    Query,
    Inject,
    UseInterceptors,
    BadRequestException
} from '@nestjs/common';
import { WaterRecordService } from './water-record.service';
import { Body_CreateWaterRecord } from './dto/create-water-record.dto';

import {
    ContextUser,
    ControllerExceptionFilter,
    JwtRoleGuard,
    LoggingInterceptor,
    PATIENT_SERVICE_PROXY_NAME,
    proxyPattern,
    RecordType,
    removePropertyForOne,
    SchedulerHelper,
    sendProxyMessage,
} from '@backend-evolved/shared';
import { ClientProxy } from '@nestjs/microservices';

@Controller('water')
export class WaterRecordController {
    constructor(
        private readonly waterRecordService: WaterRecordService,
        @Inject(PATIENT_SERVICE_PROXY_NAME)
        private readonly patientServiceProxy: ClientProxy,
    ) { }

    @Post()
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async create(
        @ContextUser() ctxUser: ContextUser,
        @Body() body: Body_CreateWaterRecord
    ) {
        const rawAmount = body?.amountInMl;
        const requestedAmountNum = Number(rawAmount);
        if (Number.isNaN(requestedAmountNum)) {
            throw new BadRequestException('amountInMl must be a valid number');
        }
        if (requestedAmountNum < 0) {
            throw new BadRequestException('amountInMl must be greater than or equal to 0');
        }
        const patient = await sendProxyMessage<
            typeof proxyPattern.patient.getById.response,
            typeof proxyPattern.patient.getById.payload
        >({
            proxy: this.patientServiceProxy,
            pattern: proxyPattern.patient.getById.key,
            data: {
                id: ctxUser.id,
                ctxUser,
                options: {
                    keepRawNutritionists: true
                }
            }
        });

        const scheduler = new SchedulerHelper();
        const requestDate = scheduler.startOfDay();

        const currentWaterGoal = patient.nutritionists
            ?.find(np => np.nutritionistId === patient.mainNutritionistId)
            ?.dailyWaterGoalInMl || "2000";

        // Get current total for the day to ensure we never go below 0
        const currentTotalResp = await this.waterRecordService.totalDailyIntake(ctxUser.id, requestDate, false);
        const currentTotal = Number(currentTotalResp?.totalIntake || 0);

        const requestedAmount = Number(body.amountInMl || 0);
        const operation = body.operation || RecordType.ADD;

        let adjustedAmount = requestedAmount;
        if (operation !== RecordType.ADD) {
            // subtraction case: don't allow total to go below 0
            const maxRemovable = currentTotal;
            if (maxRemovable <= 0) {
                // nothing to remove, return current totals without creating a record
                const totalTodayWaterIntake = removePropertyForOne(currentTotalResp, ['currentDailyWaterGoal']);
                return {
                    message: 'No subtraction performed - current total is zero.',
                    totalTodayWaterIntake
                };
            }

            adjustedAmount = Math.min(requestedAmount, maxRemovable);
            if (adjustedAmount <= 0) {
                const totalTodayWaterIntake = removePropertyForOne(currentTotalResp, ['currentDailyWaterGoal']);
                return {
                    message: 'No subtraction performed - adjusted amount is zero.',
                    totalTodayWaterIntake
                };
            }
        }

        const createdRecord = await this.waterRecordService.create({
            amountInMl: adjustedAmount.toString(),
            patientId: ctxUser.id,
            nutritionistId: patient.mainNutritionistId,
            registerHour: scheduler.format(scheduler.buildDate(), 'HH:mm:ss'),
            currentDailyWaterGoal: currentWaterGoal,
            relativeDate: requestDate,
            operation: operation,
        });

        const { totalIntake } = removePropertyForOne(
            await this.waterRecordService.totalDailyIntake(ctxUser.id, requestDate, false),
            ['currentDailyWaterGoal']
        );

        return {
            ...createdRecord,
            totalIntake,
        }
    }

    @Get('patient/:patientId/all')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    @UseInterceptors(LoggingInterceptor)
    async getAll(
        @ContextUser() ctxUser: ContextUser,
        @Param('patientId') patientId: string,
        @Query('date') date: string,
        @Query('includeRegisters') includeRegisters: boolean = true,
    ) {
        const scheduler = new SchedulerHelper();
        const searchDate = scheduler.buildDate({ date, timeZone: 0 });
        return await this.waterRecordService.totalDailyIntake(patientId, searchDate, includeRegisters);
    }
}
