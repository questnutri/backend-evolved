import { Body, Controller, Delete, Get, Param, Post, UseFilters, UseGuards } from '@nestjs/common';
import { TriggerService } from './trigger.service';
import { JwtRoleGuard, ControllerExceptionFilter } from '@backend-evolved/shared';

@Controller('triggers')
export class TriggerController {
    constructor(private readonly triggerService: TriggerService) { }

    @Get()
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async getAll() {
        return await this.triggerService.find();
    }

    @Post()
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async postOne(@Body() body: any) {
        return await this.triggerService.create(body);
    }

    @Delete()
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async deleteOne(
        @Body() body: { trackId:  string, listenerId: string },
    ) {
        const foundTrigger = await this.triggerService.findOne({where: {trackId: body.trackId, listenerId: body.listenerId}});
        return await this.triggerService.delete(foundTrigger);
    }
}