import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, UseFilters } from '@nestjs/common';
import { AUTH_SERVICE_PROXY_NAME, CreateNutritionistDto, KeysOf, Nutritionist, ProxyMessage, ServiceContract, UserRole } from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { QueryFailedError, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { RegisterUserDto } from '@backend-evolved/shared';


@Injectable()
export class NutritionistService implements ServiceContract<Nutritionist> {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @InjectRepository(Nutritionist) private readonly nutritionistRepository: Repository<Nutritionist>,
    ) { }

    async findAll(query?: Partial<KeysOf<Nutritionist>>): Promise<Nutritionist[]> {
        return await this.nutritionistRepository.find({ where: query });
    }

    async findOne(where: { [key in keyof Nutritionist]?: any }) {
        const foundNutritionist = await this.nutritionistRepository.findOneBy(where);
        if (!foundNutritionist) throw new NotFoundException('Nutritionist not found');
        return foundNutritionist;
    }

    async createOne(data: CreateNutritionistDto) {
        const payload = {
            email: data.email,
            password: data.password,
            role: UserRole.NUTRITIONIST
        };
        const userCreationResult = await firstValueFrom(
            this.authServiceProxy.send<ProxyMessage<string>, RegisterUserDto>('user.creation', payload)
        );
        if (userCreationResult && 'error' in userCreationResult) throw new RpcException(userCreationResult);

        const userId = userCreationResult.payload;
        if (!userId) throw new InternalServerErrorException('Auth service did not return user id');

        const nutritionist = this.nutritionistRepository.create({ ...data, id: userId });
        return await this.nutritionistRepository.save(nutritionist);
    }

    async updateOne(query: Partial<KeysOf<Nutritionist>>, data: Partial<CreateNutritionistDto>) {
        try {
            const result = await this.nutritionistRepository.update(query, data);
            if (result.affected === 0) throw new NotFoundException('Nutritionist not found');
            return await this.nutritionistRepository.findOneBy(query);
        } catch (error: any) {
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


    async deleteOne(query: Partial<KeysOf<Nutritionist>>): Promise<void> {
        const nutritionist = await this.nutritionistRepository.findOneBy(query);
        if (!nutritionist) throw new NotFoundException('Nutritionist not found');
        const result = await this.nutritionistRepository.delete(nutritionist);
        if (result.affected === 0) throw new InternalServerErrorException('Failed to delete nutritionist');
    }

}
