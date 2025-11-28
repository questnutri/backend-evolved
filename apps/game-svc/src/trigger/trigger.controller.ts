import { Body, Controller, Get, Post } from '@nestjs/common';
import { TriggerService } from './trigger.service';

@Controller('triggers')
export class TriggerController {
    constructor(private readonly triggerService: TriggerService) { }

    @Get()
    async getAll() {
        return await this.triggerService.find();
    }

    @Post()
    async postOne(@Body() body: any) {
        return await this.triggerService.create(body);
    }
}