import {
    ConflictException,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import {
    AUTH_SERVICE_PROXY_NAME,
    buildFiltering,
    CreateNutritionistDto,
    errorMessagePattern,
    KeysOf,
    Nutritionist,
    NutritionistFindOptions,
    PaginationQuery,
    proxyPattern,
    RegisterUserDto,
    removeProperties,
    sendProxyMessage,
    ServiceContract,
    UserRole
} from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import {
    In,
    QueryFailedError,
    Repository
} from 'typeorm';


@Injectable()
export class NutritionistService implements ServiceContract<Nutritionist> {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @InjectRepository(Nutritionist) private readonly nutritionistRepository: Repository<Nutritionist>,
    ) { }

    async findAll(find?: NutritionistFindOptions & PaginationQuery): Promise<Nutritionist[]> {
        let page = find?.page || 1;
        let limit = find?.limit || 20;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        const { where, filter } = find || {};
        let foundNutritionists = await this.nutritionistRepository.find({
            where: {
                ...where,
                ...buildFiltering(filter)
            },
            skip: (page && limit) ? (page - 1) * limit : undefined,
            take: limit || undefined,
            select: find?.select
        });

        foundNutritionists = removeProperties(foundNutritionists, find?.removeKeys);

        return foundNutritionists;
    }

    async findManyByIds(
        ids: string[],
        options?: NutritionistFindOptions & PaginationQuery
    ): Promise<Nutritionist[]> {
        if (options) {
            options.where = {
                id: In(ids)
            }
        }
        return await this.findAll(options);
    }

    async findOneWhere(where: { [key in keyof Nutritionist]?: any }) {
        const foundNutritionist = await this.nutritionistRepository.findOneBy(where);
        if (!foundNutritionist) throw new NotFoundException(
            errorMessagePattern
                .nutritionist
                .notFound
                .fn()
        );
        return foundNutritionist;
    }

    async createOne(data: CreateNutritionistDto) {
        const payload = {
            email: data.email,
            password: data.password,
            role: UserRole.NUTRITIONIST
        };

        let userCreationResult = await sendProxyMessage<
            typeof proxyPattern.user.creation.response,
            typeof proxyPattern.user.creation.payload
        >(
            {
                proxy: this.authServiceProxy,
                pattern: proxyPattern.user.creation.key,
                data: payload,
                options: {
                    retry: {
                        count: 3, delay: 50
                    }
                }
            }
        );

        console.log(userCreationResult);

        if (!userCreationResult.id) {
            throw new InternalServerErrorException(
                errorMessagePattern
                    .auth
                    .didntReturnAValidId
                    .fn()
            );
        }

        try {
            const nutritionist = this.nutritionistRepository.create({ ...data, id: userCreationResult.id });
            return await this.nutritionistRepository.save(nutritionist);
        } catch (error: any) {
            await sendProxyMessage<
                typeof proxyPattern.user.deletionByEmail.response,
                typeof proxyPattern.user.deletionByEmail.payload
            >(
                {
                    proxy: this.authServiceProxy,
                    pattern: proxyPattern.user.deletionByEmail.key,
                    data: { email: userCreationResult.email }
                }
            );
            // console.log('User deletion result after nutritionist creation failure:', );
            throw new InternalServerErrorException(
                errorMessagePattern
                    .nutritionist
                    .creationFailed
                    .fn(error)
            );
        }
    }

    async updateOneById(id: string, data: Partial<CreateNutritionistDto>) {
        try {
            const result = await this.nutritionistRepository.update({ id }, data);
            if (result.affected === 0) throw new NotFoundException(
                errorMessagePattern
                    .nutritionist
                    .notFound
                    .fn()
            );
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
                    throw new InternalServerErrorException(
                        errorMessagePattern
                            .nutritionist
                            .updateFailed
                            .fn(error)
                    );
            }
        }
    }

    async deleteOneById(id: string): Promise<void> {
        const nutritionist = await this.nutritionistRepository.findOne({ where: { id } });
        if (!nutritionist) throw new NotFoundException(
            errorMessagePattern
                .nutritionist
                .notFound
                .fn()
        );
        try {
            await this.nutritionistRepository.remove(nutritionist);
        } catch (error) {
            throw new InternalServerErrorException(
                errorMessagePattern
                    .nutritionist
                    .deleteFailed
                    .fn(error)
            );
        }
    }

    async softDeleteOneById(id: string): Promise<boolean> {
        try {
            const nutritionist = await this.nutritionistRepository.findOne({ where: { id } });
            if (!nutritionist) throw new NotFoundException(
                errorMessagePattern
                    .nutritionist
                    .notFound
                    .fn()
            );
            nutritionist.firstName = "DELETED";
            nutritionist.lastName = "DELETED";
            nutritionist.crn = null;
            nutritionist.email = "DELETED";
            nutritionist.phone = null;
            nutritionist.documentNumber = null;
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