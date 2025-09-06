import { Controller, Get, Post, Body } from '@nestjs/common';
import { TacoService } from './taco.service';

@Controller('taco')
export class TacoController {
    constructor(private readonly tacoService: TacoService) { }

    @Get()
    getData() {
        return this.tacoService.findAll();
    }

    @Post()
    async createTaco(@Body() createTacoDto: any) {
        return this.tacoService.create(createTacoDto);
    }

}
