import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientNutritionist, ServiceContract, KeysOf, errorMessagePattern, Patient, PaginationQuery, PatientFindOptions } from '@backend-evolved/shared';
import { Repository } from 'typeorm';

@Injectable()
export class PatientNutritionistService implements ServiceContract<PatientNutritionist> {
    constructor(
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,
    ) { }

    async findAll(
        options?: PatientFindOptions & PaginationQuery
    ): Promise<PatientNutritionist[]> {
        let page = options?.page || 1;
        if (page < 1) page = 1;
        let limit = options?.limit || 20;
        if (limit < 1) limit = 1;

        return await this.patientNutritionistRepository.find({
            where: options?.where,
            relations: ['patient'],
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findOnePatient(where: any): Promise<Patient> {
        const foundPatient = await this.patientNutritionistRepository.findOne({ where, relations: ['patient'] });
        if (!foundPatient) {
            throw new NotFoundException(errorMessagePattern.patient.notFound.fn());
        }
        return foundPatient.patient;
    }

    async findOne(where: any) {
        const foundRelation = await this.patientNutritionistRepository.findOne({ where, relations: ['patient'] });
        if (!foundRelation) {
            throw new NotFoundException(errorMessagePattern.patient.notFound.fn());
        }
        return foundRelation;
    }

    async createOne(data: Partial<PatientNutritionist>): Promise<PatientNutritionist> {
        const created = this.patientNutritionistRepository.create(data);
        return await this.patientNutritionistRepository.save(created);
    }

    async updateOne(query: KeysOf<PatientNutritionist>, data: Partial<PatientNutritionist>): Promise<PatientNutritionist | null> {
        throw new Error('Method not implemented.');
    }

    async deleteOne(relation: PatientNutritionist): Promise<void> {
        await this.patientNutritionistRepository.softRemove(relation);
    }

    async isNutritionistRelated(patientId: string, nutritionistId: string): Promise<boolean> {
        const relation = await this.patientNutritionistRepository.findOneBy({ patientId, nutritionistId });
        return !!relation;
    }

}
