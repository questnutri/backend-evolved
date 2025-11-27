import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @MessagePattern('log.message')
    getData(
        @Payload() data: any
    ) {
        console.log('[LOG-SVC] Received log message:');
        console.log(data);
    }
}