import { Diet, PATIENT_SERVICE_PROXY_NAME, ProxyMessage, ServiceContract } from '@backend-evolved/shared';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DietService implements ServiceContract<Diet> {
    constructor(
        @InjectRepository(Diet) private readonly dietRepository: Repository<Diet>,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientProxyService: ClientProxy
    ) { }

    async findAll(query: { [key in keyof Diet]?: any }): Promise<Diet[]> {
        return await this.dietRepository.find({ where: query });
    }

    async findOne(query: { [key in keyof Diet]?: any }): Promise<Diet | null> {
        return await this.dietRepository.findOne({ where: query });
    }

    async createOne(data: Partial<Diet>): Promise<Diet> {
        const isNutritionistRelated = await firstValueFrom(
            this.patientProxyService.send<ProxyMessage<boolean>, { nutritionistId: string, patientId: string }>('patient.isRelatedToNutritionist', {
                patientId: data.patientId!,
                nutritionistId: data.nutritionistId!
            })
        );
        if (isNutritionistRelated && 'error' in isNutritionistRelated) {
            throw new RpcException(isNutritionistRelated);
        }
        if(isNutritionistRelated.payload) {
            const diet = this.dietRepository.create(data);
            return await this.dietRepository.save(diet);
        }
        throw new NotFoundException('Patient not found or not related to the nutritionist');
    }

    async updateOne(query: any, data: Partial<Diet>): Promise<Diet> {
        const diet = await this.dietRepository.findOne({ where: query });
        if (!diet) {
            throw new NotFoundException('Diet not found');
        }
        this.dietRepository.merge(diet, data);
        return await this.dietRepository.save(diet);
    }

    async deleteOne(query: any): Promise<void> {
        const result = await this.dietRepository.delete(query);
        if (result.affected === 0) throw new NotFoundException('Diet not found');
    }



}
