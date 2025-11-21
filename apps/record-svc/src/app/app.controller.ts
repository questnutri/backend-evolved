import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {

    @Get('health')
    @ApiExcludeEndpoint()
    healthCheck() {
        return { active: true };
    }
}
