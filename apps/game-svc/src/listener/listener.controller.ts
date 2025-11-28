import { Body, Controller, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventOrigin, ListenerEntity } from '@backend-evolved/shared';
import { ListenerService } from './listener.service';

@Controller('listener')
export class ListenerController {
    constructor(
        private readonly listenerService: ListenerService,
        
    ) {}

    @MessagePattern('log.message')
    async getData(@Payload() log: any): Promise<void> {
        if (log.origin === EventOrigin.CONTROLLER) {
            console.log("Log received on listener controller: ");
            console.log(log)
            const foundListeners = await this.listenerService.find({
                origin: EventOrigin.CONTROLLER,
                controller: log.controller,
                method: log.method,
                path: log.path,
            });
            for (const listener of foundListeners) {
                if (listener.triggers && listener.triggers.length > 0) {
                    for (const trigger of listener.triggers) {
                        console.log(trigger);
                        // try {
                        //     const result = await trigger.activate(log);
                        //     console.log(`[Game-svc] Trigger activated:`, result);
                        // } catch (error: any) {
                        //     console.error(`[Game-svc] Failed to activate trigger:`, error.message);
                        // }
                    }
                }
            }
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