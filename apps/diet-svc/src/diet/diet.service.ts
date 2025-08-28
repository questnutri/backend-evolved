import { Diet, PATIENT_SERVICE_PROXY_NAME, ServiceContract } from '@backend-evolved/shared';
import { Injectable, NotFoundException, Inject, HttpException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DietService implements ServiceContract<Diet> {
    constructor(
        @InjectRepository(Diet) private readonly dietRepository: Repository<Diet>,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
    ) { }

    async findAll(query: { [key in keyof Diet]?: any }): Promise<Diet[]> {
        return await this.dietRepository.find({ where: query });
    }

    async findOne(query: { [key in keyof Diet]?: any }): Promise<Diet | null> {
        return await this.dietRepository.findOne({ where: query });
    }

    async createOne(data: Partial<Diet>): Promise<Diet> {
        console.log('Creating diet with data:', data);
        try {
            const diet = this.dietRepository.create(data);
            return await this.dietRepository.save(diet);
            throw new NotFoundException("Patient not found or not related to nutritionist");
        } catch (error: any) {
            console.log(error);
            if (error instanceof HttpException) {
                throw error;
            }
            if (error instanceof QueryFailedError) {
                throw new ConflictException(error.driverError.detail);
            }
            switch (error.source) {
                case 'ConflictException':
                    throw new ConflictException(error?.detail);
                default:
                    throw new InternalServerErrorException('Failed to update nutritionist: ' + (error?.detail ?? 'unknown'));
            }
        }
    }

    async updateOne(query: any, data: Partial<Diet>): Promise<Diet | null> {
        const diet = await this.dietRepository.findOne({ where: query });
        if (!diet) {
            throw new NotFoundException('Diet not found');
        }
        this.dietRepository.merge(diet, data);
        return await this.dietRepository.save(diet);
    }

    async deleteOne(query: any): Promise<void> {
        try {
            const result = await this.dietRepository.delete(query);
            if (result.affected === 0) throw new NotFoundException('Diet not found');
        } catch (error) {

        }
    }



}
