import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TacoAliment } from '../../../../libs/shared/src/entities';
import { MongoRepository } from 'typeorm';
import { AlimentBaseService } from '../aliment/aliment-base.service';

@Injectable()
export class TacoService extends AlimentBaseService {
    constructor(
        @InjectRepository(TacoAliment)
        override repository: MongoRepository<TacoAliment>
    ) {
        super(repository);
    }

}
