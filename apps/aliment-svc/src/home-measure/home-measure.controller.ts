import { Body, Controller, Get, Post } from '@nestjs/common';
import { HomeMeasureService } from './home-measure.service';

@Controller('home-measure')
export class HomeMeasureController {
    constructor(private readonly homeMeasureService: HomeMeasureService) { }

    @Get()
    getData() {
        return this.homeMeasureService.findAll();
    }

    @Post()
    async createOne(@Body() createHomeMeasureDto: any) {
        return this.homeMeasureService.create(createHomeMeasureDto);
    }
}
