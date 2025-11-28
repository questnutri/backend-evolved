import { TriggerEntity } from '@backend-evolved/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TriggerService {
    constructor(
        @InjectRepository(TriggerEntity)
        private triggerRepository: Repository<TriggerEntity>,
    ) { }

    async create(trigger: {
        trackId: string
        listenerId: string
    }) {
        const existingTrigger = await this.triggerRepository.findOne({
            where: { trackId: trigger.trackId, listenerId: trigger.listenerId },
        });
        if (existingTrigger) {
            throw new BadRequestException('Trigger with the given trackId and listenerId already exists.');
        }

        const createdTrigger = this.triggerRepository.create({
            trackId: trigger.trackId,
            listenerId: trigger.listenerId,
        });

        return this.triggerRepository.save(createdTrigger);
    }

    async find() {
        return await this.triggerRepository.find({ relations: ['track', 'track.records', 'listener'] });
    }
}