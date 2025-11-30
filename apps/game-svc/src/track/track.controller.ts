import { Body, Controller, Get, Post } from '@nestjs/common';
import { TrackTemplateService } from './track-template.service';
import { TrackTemplate } from '@backend-evolved/shared';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TrackService } from './track.service';

@Controller('tracks')
export class TrackController {
    constructor(
        private readonly trackTemplateService: TrackTemplateService,
        private readonly trackService: TrackService
    ) {}

    @Get('all')
    @ApiOperation({
        summary: 'Retrieve all track templates',
        description: 'Fetches a list of all track templates available in the system.'
    })
    @ApiOkResponse({
        description: 'A list of track templates has been successfully retrieved.',
        type: [TrackTemplate],
    })
    async getAll() {
        return await this.trackService.findAllTemplates();
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new track template',
        description: 'Creates a new track template with the provided details.'
    })
    @ApiCreatedResponse({
        description: 'The track template has been successfully created.',
        type: TrackTemplate,
    })
    async postOne(
        @Body() body: any
    ) {
        return await this.trackService.createTemplate(body);

        // return await this.trackTemplateService.create(body);
    }
}