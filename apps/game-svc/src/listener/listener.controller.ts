import { Body, Controller, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventOrigin, ListenerEntity } from '@backend-evolved/shared';
import { ListenerService } from './listener.service';

@Controller('listener')
export class ListenerController {
    constructor(private readonly listenerService: ListenerService) {}

    @MessagePattern('log.message')
    async getData(@Payload() log: any): Promise<void> {
        if(log.origin === EventOrigin.CONTROLLER) {
            const found = await this.listenerService.find({
                origin: EventOrigin.CONTROLLER,
                controller: log.controller,
                method: log.method,
                path: log.path,
            });
            console.log(found);
        } else {
            console.log(`[Game-svc] Log is not controller origin`);
        }
    }

    @Post()
    async createListener(
        @Body() listenerEntity: Partial<ListenerEntity>
    ) {
        return await this.listenerService.create(listenerEntity);
    }
}