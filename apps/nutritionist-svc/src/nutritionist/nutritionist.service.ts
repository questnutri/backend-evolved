import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import {
    AUTH_SERVICE_PROXY_NAME,
    buildFiltering,
    CreateNutritionistDto,
    errorMessagePattern, Nutritionist,
    NutritionistFindOptions,
    NutritionistIncludeOptions,
    PaginationQuery,
    PATIENT_SERVICE_PROXY_NAME,
    proxyPattern, removePropertiesForMany,
    removePropertyForOne,
    sendProxyMessage,
    ServiceContract,
    UserRole
} from '@backend-evolved/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import {
    In,
    Repository
} from 'typeorm';
import { AddressService } from '../address/address.service';


@Injectable()
export class NutritionistService implements ServiceContract<Nutritionist> {
    constructor(
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(PATIENT_SERVICE_PROXY_NAME) private readonly patientServiceProxy: ClientProxy,
        @InjectRepository(Nutritionist) private readonly nutritionistRepository: Repository<Nutritionist>,
        private readonly addressService: AddressService,
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

        foundNutritionists = removePropertiesForMany(foundNutritionists, find?.removeKeys);

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

    async findOne(
        options?: NutritionistFindOptions
    ): Promise<Nutritionist> {
        let nutritionist = await this.nutritionistRepository.findOne({
            where: options?.where,
            relations: options?.relations
        });
        if (!nutritionist) {
            throw new NotFoundException(
                errorMessagePattern
                    .nutritionist
                    .notFound
                    .fn()
            );
        }

        nutritionist = await this.applyInclude({ ...options }, nutritionist);
        nutritionist = removePropertyForOne(nutritionist!, [...(options?.removeKeys || [])]);

        return nutritionist!;
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

    async updateOne(nutritionist: Nutritionist, payload: Partial<Nutritionist>) {
        // Removing unupdatable fields
        const { email, documentNumber, ...rest } = payload;
        const updatePayload = { ...rest } as Partial<Nutritionist>;

        this.nutritionistRepository.merge(nutritionist, updatePayload);
        const saved = await this.nutritionistRepository.save(nutritionist);
        return this.applyInclude({}, saved)
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
            return false;
        }
    }

    async applyIncludeOnMany(
        options: NutritionistIncludeOptions,
        nutritionists: Nutritionist[]
    ): Promise<Nutritionist[]> {

        for (let i = 0; i < nutritionists.length; i++) {
            nutritionists[i] = await this.applyInclude(options, nutritionists[i]);
        }

        return Promise.resolve(nutritionists);
    }

    async applyInclude(
        options: NutritionistIncludeOptions,
        nutritionist: Nutritionist
    ) {
        if (!options.includeAddresses && nutritionist.mainAddress) {
            const address = await this.addressService.findOne({
                where: { id: nutritionist.mainAddress, nutritionistId: nutritionist.id }
            });
            (nutritionist as any).mainAddress = address;
        }
        if (options.includeAddresses) {
            const addresses = await this.addressService.findAll({
                where: { nutritionistId: nutritionist.id },
                limit: 99,
                removeKeys: ['nutritionist', 'nutritionistId']
            });
            (nutritionist as any).addresses = addresses.items;
            if (nutritionist.mainAddress) {
                let foundOnList = addresses.items.find(
                    addr => addr.id === nutritionist.mainAddress
                );
                if (!foundOnList) { //fallback in case mainAddress is not in the fetched list, rare but possible
                    foundOnList = await this.addressService.findOne({
                        where: { id: nutritionist.mainAddress, nutritionistId: nutritionist.id },
                        removeKeys: ['nutritionist', 'nutritionistId']
                    });
                }
                (nutritionist as any).mainAddress = foundOnList;
            }
        }
        if (options.includePatients) {
            const patients = await sendProxyMessage<
                typeof proxyPattern.patient.findAllFromNutritionist.response,
                typeof proxyPattern.patient.findAllFromNutritionist.payload
            >({
                proxy: this.patientServiceProxy,
                pattern: proxyPattern.patient.findAllFromNutritionist.key,
                data: { nutritionistId: nutritionist.id },
            });
            (nutritionist as any).patients = patients;
        }

        return nutritionist;
    }
}