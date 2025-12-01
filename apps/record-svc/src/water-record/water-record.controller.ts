import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    UseFilters,
    Query
} from '@nestjs/common';
import { WaterRecordService } from './water-record.service';
import { Body_CreateWaterRecord } from './dto/create-water-record.dto';

import {
    ContextUser,
    ControllerExceptionFilter,
    JwtRoleGuard,
} from '@backend-evolved/shared';

//FIXME: REFACTOR
@Controller('water')
export class WaterRecordController {
    constructor(
        private readonly waterRecordService: WaterRecordService,
    ) { }

    @Post(':waterGoalId')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async create(
        @Param('waterGoalId') waterGoalId: string,
        @ContextUser() ctxUser: ContextUser,
        @Body() body: Body_CreateWaterRecord
    ) {
        return await this.waterRecordService.create({
            waterGoalId,
            patientId: ctxUser.id,
            ...body
        });
    }

    @Get(':waterGoalId')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    findAll(
        @Param('waterGoalId') waterGoalId: string,
        @Query('date') date: Date,
        @ContextUser() ctxUser: ContextUser
    ) {
        return this.waterRecordService.findAllFromWaterGoal({
            waterGoalId,
            patientId: ctxUser.id,
            relativeDate: date ?? new Date(),
        });
    }
}
