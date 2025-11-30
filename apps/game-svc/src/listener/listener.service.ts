import { errorMessagePattern, ListenerEntity, ListenerFindOptions, PaginationQuery } from '@backend-evolved/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ListenerService {
    constructor(
        @InjectRepository(ListenerEntity)
        private readonly listenerRepository: Repository<ListenerEntity>,
    ) { }

    async create(listenerEntity: Partial<ListenerEntity>) {
        const listener = this.listenerRepository.create(listenerEntity);
        return await this.listenerRepository.save(listener);
    }

    async find(options?: PaginationQuery & ListenerFindOptions) {
        let { where, relations } = options || {};
        if (options?.includeTriggers) {
            if (!relations) relations = [];
            relations.push('triggers', 'triggers.track', 'triggers.track.achievements');
        }
        return await this.listenerRepository.find({ where, relations })
    }

    async findOne(options?: PaginationQuery & ListenerFindOptions): Promise<ListenerEntity> {
        let { where, relations } = options || {};
        if (options?.includeTriggers) {
            if (!relations) relations = [];
            relations.push('triggers');
        }
        const foundListener = await this.listenerRepository.findOne({ where, relations });
        if(!foundListener) throw new NotFoundException(errorMessagePattern.game.listener.notFound.fn());
        return foundListener;
    }

    async delete(listener: ListenerEntity) {
        return await this.listenerRepository.remove(listener);
    }
}
