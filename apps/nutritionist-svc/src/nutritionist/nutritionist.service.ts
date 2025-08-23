import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, Query } from '@nestjs/common';
import { AUTH_SERVICE_PROXY_NAME, CreateNutritionistDto, Nutritionist, UserRole } from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { QueryFailedError, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { RegisterUserDto } from '@backend-evolved/shared';


@Injectable()
export class NutritionistService {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @InjectRepository(Nutritionist) private readonly nutritionistRepository: Repository<Nutritionist>,
    ) { }

    async create(data: CreateNutritionistDto) {
        try {
            const payload = {
                email: data.email,
                password: data.password,
                role: UserRole.NUTRITIONIST
            };
            const userId: string = await firstValueFrom(
                this.authServiceProxy.send<string, RegisterUserDto>('user.creation', payload)
            );
            if (!userId) throw new InternalServerErrorException('Auth service did not return user id');
            const nutritionist = this.nutritionistRepository.create({ ...data, id: userId });
            return await this.nutritionistRepository.save(nutritionist);
        } catch (error: any) {
            // console.error(`Nutritionist creation error`, error);
            await firstValueFrom(
                this.authServiceProxy.send<boolean, string>('user.deletion', data.email)
            );

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
                    throw new InternalServerErrorException('Failed to create nutritionist: ' + (error?.detail ?? 'unknown'));
            }
        }
    }

    async findOne(where: {[key in keyof Nutritionist]?: any}) {
        return await this.nutritionistRepository.findOneBy(where);
    }

    async update(nutritionistId: string, data: Partial<CreateNutritionistDto>) {
        try {
            await this.nutritionistRepository.update(nutritionistId, data);
            return await this.nutritionistRepository.findOneBy({ id: nutritionistId });
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

    // findAll() {
    //     return `This action returns all nutritionist`;
    // }

    // findOne(id: number) {
    //     return `This action returns a #${id} nutritionist`;
    // }

    // update(id: number, updateNutritionistDto: UpdateNutritionistDto) {
    //     return `This action updates a #${id} nutritionist`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} nutritionist`;
    // }
}
