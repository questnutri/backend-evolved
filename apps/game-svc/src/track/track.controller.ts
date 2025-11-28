import { Body, Controller, Post } from '@nestjs/common';
import { TrackService } from './track.service';

@Controller('tracks')
export class TrackController {
    constructor(private readonly listenerService: TrackService) {}

    @Post()
    async postOne(@Body() body: any) {
        return await this.listenerService.create(body);
    }
}