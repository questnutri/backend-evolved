import { ListenerEntity } from '@backend-evolved/shared';
import { Injectable } from '@nestjs/common';
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

    async find(where: any) {
        return await this.listenerRepository.find({ where })
    }
}
