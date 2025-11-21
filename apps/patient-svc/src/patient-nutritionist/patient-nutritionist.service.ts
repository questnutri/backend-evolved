import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientNutritionist, ServiceContract, KeysOf } from '@backend-evolved/shared';
import { Repository } from 'typeorm';

@Injectable()
export class PatientNutritionistService implements ServiceContract<PatientNutritionist> {
    constructor(
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,
    ) { }

    async findAll(where: any) {
        return await this.patientNutritionistRepository.find({
            where,
            relations: ['patient']
        });
    }

    async findOneWhere(where: Partial<KeysOf<PatientNutritionist>>): Promise<PatientNutritionist | null> {
        return await this.patientNutritionistRepository.findOne({ where });
    }

    async createOne(data: Partial<PatientNutritionist>): Promise<PatientNutritionist> {
        const created = this.patientNutritionistRepository.create(data);
        return await this.patientNutritionistRepository.save(created);
    }

    async updateOne(query: KeysOf<PatientNutritionist>, data: Partial<PatientNutritionist>): Promise<PatientNutritionist | null> {
        throw new Error('Method not implemented.');
    }

    async deleteOne(query: KeysOf<PatientNutritionist>): Promise<void> {
        const result = await this.patientNutritionistRepository.delete(query);
        if (result.affected === 0) {
            throw new NotFoundException('PatientNutritionist relation not found');
        }
    }

    async isNutritionistRelated(patientId: string, nutritionistId: string): Promise<boolean> {
        const relation = await this.patientNutritionistRepository.findOneBy({ patientId, nutritionistId });
        return !!relation;
    }

}
