import { Controller } from '@nestjs/common';
import { EventService } from './event.service';

@Controller()
export class EventController {
    constructor(private readonly eventService: EventService) { }
}


// GOAL: control weight achievements
// event => weight record
// triggered by => record-svc // controller // post // '' // status 201 << LISTENING TO!
// ENUM CONTROLLER: controller / method / status