import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { SecretAliment } from '@backend-evolved/shared';
import { AlimentBaseService } from '../aliment/aliment-base.service';

@Injectable()
export class SecretAlimentService extends AlimentBaseService{
    constructor(
        @InjectRepository(SecretAliment)
        override repository: MongoRepository<SecretAliment>
    ) {
        super(repository);
    }
}
