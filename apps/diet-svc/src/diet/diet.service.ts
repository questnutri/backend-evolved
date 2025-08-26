import { CreateDietDto, Diet, ServiceContract } from '@backend-evolved/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { Repository } from 'typeorm';
import { UpdateDietDto } from '../../../../libs/shared/src/dto/diet/update-diet.dto';

@Injectable()
export class DietService implements ServiceContract<Diet> {
    constructor(
        @InjectRepository(Diet) private readonly dietRepository: Repository<Diet>,
    ) { }

    async create(data: Partial<Diet>): Promise<Diet> {
        const diet = this.dietRepository.create(data);
        return await this.dietRepository.save(diet);
    }

    async findAll(query: { [key in keyof Diet]?: any }): Promise<Diet[]> {
        return await this.dietRepository.find({ where: query });
    }

    async findById(id: string): Promise<Diet | null> {
        return await this.dietRepository.findOne({ where: { id } });
    }


    async update(id: string, dietData: UpdateDietDto): Promise<any> {
        const diet = await this.dietRepository.findOne({ where: { id } });
        if (!diet) {
            throw new NotFoundException("Diet not found");
        }
        this.dietRepository.merge(diet, dietData);
        return await this.dietRepository.save(diet);
    }

    async delete(id: string): Promise<void> {
        const diet = await this.dietRepository.findOne({ where: { id } });
        if (!diet) {
            throw new NotFoundException("Diet not found");
        }
        await this.dietRepository.remove(diet);

    }

}
