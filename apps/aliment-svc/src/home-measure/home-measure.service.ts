import { Injectable } from '@nestjs/common';
import { MongoRepository } from 'typeorm';
import { HomeMeasureAliment } from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { AlimentBaseService } from '../aliment/aliment-base.service';

@Injectable()
export class HomeMeasureService extends AlimentBaseService {
    constructor(
        @InjectRepository(HomeMeasureAliment)
        override repository: MongoRepository<HomeMeasureAliment>
    ) {
        super(repository);
    }

}
