import { errorMessagePattern, Trigger } from '@backend-evolved/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TriggerService {
    constructor(
        @InjectRepository(Trigger)
        private triggerRepository: Repository<Trigger>,
    ) { }

    async create(trigger: {
        trackId: string
        listenerId: string
    }) {
        const existingTrigger = await this.triggerRepository.findOne({
            where: { trackId: trigger.trackId, listenerId: trigger.listenerId },
        });
        if (existingTrigger) {
            throw new BadRequestException(
                errorMessagePattern
                .game
                .trigger
                .triggerForListenerAndTrackAlreadyExists
                .fn(
                    {
                        trackId: trigger.trackId,
                        listenerId: trigger.listenerId
                    }
                )
            );
        }
        const createdTrigger = this.triggerRepository.create(trigger);
        return await this.triggerRepository.save(createdTrigger);

    }

    async find() {
        return await this.triggerRepository.find({ relations: ['track', 'listener'] });
    }
}