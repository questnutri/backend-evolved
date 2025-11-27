import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
    constructor() {}

    @Get('health')
    @ApiExcludeEndpoint()
    getHealthCheck() {
        return { active: true };
    }
}