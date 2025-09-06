import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HomeMeasureAliment } from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { AlimentBaseService } from '../aliment/aliment-base.service';

@Injectable()
export class HomeMeasureService extends AlimentBaseService {
    constructor(
        @InjectRepository(HomeMeasureAliment)
        override repository: Repository<HomeMeasureAliment>
    ) {
        super(repository);
    }

}
