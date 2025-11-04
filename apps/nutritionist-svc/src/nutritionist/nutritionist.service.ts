import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AUTH_SERVICE_PROXY_NAME, CreateNutritionistDto, KeysOf, Nutritionist, proxyPattern, sendProxyMessage, ServiceContract, UserRole } from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { In, QueryFailedError, Repository } from 'typeorm';
import { RegisterUserDto } from '@backend-evolved/shared';


@Injectable()
export class NutritionistService implements ServiceContract<Nutritionist> {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @InjectRepository(Nutritionist) private readonly nutritionistRepository: Repository<Nutritionist>,
    ) { }

    async findAll(query?: Partial<KeysOf<Nutritionist>>): Promise<Nutritionist[]> {
        return await this.nutritionistRepository.find({ where: query as any });
    }

    async findManyByIds(ids: string[]): Promise<Nutritionist[]> {
        console.log(ids);
        if (!ids.length) return [];
        return await this.nutritionistRepository.find({
            where: { id: In(ids) }
        });
    }

    async findOneWhere(where: { [key in keyof Nutritionist]?: any }) {
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
        const userId = await sendProxyMessage<string, RegisterUserDto>(
            {
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.creation,
                data: payload
            }
        );

        if (!userId) throw new InternalServerErrorException('Auth service did not return user id');

        try {
            const nutritionist = this.nutritionistRepository.create({ ...data, id: userId });
            return await this.nutritionistRepository.save(nutritionist);
        } catch (error: any) {
            const userDeletionResult = await sendProxyMessage({
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.deletionById,
                data: { id: userId }
            });
            console.log('User deletion result after nutritionist creation failure:', userDeletionResult);
            throw new InternalServerErrorException('Failed to create nutritionist: ' + (error?.detail ?? 'unknown'));
        }
    }

    async updateOneById(id: string, data: Partial<CreateNutritionistDto>) {
        try {
            const result = await this.nutritionistRepository.update({ id }, data);
            if (result.affected === 0) throw new NotFoundException('Nutritionist not found');
            return await this.nutritionistRepository.findOne({ where: { id } });
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

    async deleteOneById(id: string): Promise<void> {
        const nutritionist = await this.nutritionistRepository.findOne({ where: { id } });
        if (!nutritionist) throw new NotFoundException('Nutritionist not found');
        try {
            await this.nutritionistRepository.remove(nutritionist);
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete nutritionist');
        }
    }

    async softDeleteOneById(id: string): Promise<boolean> {
        try {
            const nutritionist = await this.nutritionistRepository.findOne({ where: { id } });
            if (!nutritionist) throw new NotFoundException('Nutritionist not found');
            nutritionist.name = "DELETED";
            nutritionist.crn = "DELETED";
            nutritionist.email = "DELETED";
            nutritionist.phone = "DELETED";
            nutritionist.documentNumber = "DELETED";
            await this.nutritionistRepository.save(nutritionist);
            console.log(`Nutritionist soft deleted`);
            console.log(nutritionist);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}