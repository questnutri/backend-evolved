import {
    ConflictException,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
    UserRole,
    RegisterUserDto,
    Patient,
    AUTH_SERVICE_PROXY_NAME,
    PatientNutritionist,
    ServiceContract,
    ProxyMessage,
    proxyPattern,
    NUTRITIONIST_SERVICE_PROXY_NAME,
    Nutritionist, sendProxyMessage,
    errorMessagePattern,
    DIET_SERVICE_PROXY_NAME,
    DietIncludeOptions,
    PatientIncludeOptions,
    PatientFindOptions,
    buildFiltering,
    PaginationQuery,
    removeProperties
} from '@backend-evolved/shared';
import { firstValueFrom } from 'rxjs';
import { In, QueryFailedError, Repository } from 'typeorm';
import { error } from 'console';

export type TreatedPatient = Partial<Omit<Patient, 'nutritionists'>> & { nutritionists: Nutritionist[] };

@Injectable()
export class PatientService implements ServiceContract<Patient> {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,
        @Inject(NUTRITIONIST_SERVICE_PROXY_NAME) private readonly nutritionistProxy: ClientProxy,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(DIET_SERVICE_PROXY_NAME) private readonly dietServiceProxy: ClientProxy,
    ) { }

    async findAll(
        find?: PatientFindOptions & PaginationQuery
    ): Promise<Patient[]> {
        let page = find?.page || 1;
        let limit = find?.limit || 20;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;

        let { where } = find || {};

        let foundPatients = await this.patientRepository.find({
            where: {
                ...where,
                ...buildFiltering(find?.filter)
            },
            relations: find?.relations || ['nutritionists'],
            select: find?.select,
            skip: (page && limit) ? (page - 1) * limit : undefined,
            take: limit || undefined,
        });

        foundPatients = await this.applyIncludes({ ...find, includeFoods: false, includeMeals: false }, foundPatients);
        foundPatients = removeProperties(foundPatients, find?.removeKeys);

        return foundPatients;
    }

    async findManyByIds(
        ids: string[],
        options?: PatientFindOptions & PaginationQuery
    ): Promise<Patient[]> {
        if (options) {
            options['where'] = {
                id: In(ids),
            }
        }
        return await this.findAll(options);
    }

    async findOne(
        options?: PatientFindOptions
    ): Promise<Patient> {
        let patient = await this.patientRepository.findOne({
            where: options?.where,
            relations: options?.relations || ['nutritionists']
        });
        if (!patient) {
            throw new NotFoundException(
                errorMessagePattern
                    .patient
                    .notFound
                    .key
            );
        }

        patient = await this.applyIncludes({ ...options }, [patient]).then(res => res[0]);
        patient = removeProperties([patient!], options?.removeKeys)[0];

        return patient!;
    }

    // async createOne(data: Partial<Patient> & { email: string } & { nutritionistId: string }): Promise<Patient> {
    //     // Cast data to CreatePatientDto for compatibility
    //     try {
    //         const payload = {
    //             email: data.email,
    //             password: data.documentNumber!.replace(/[.\-\s]/g, ''),
    //             role: UserRole.PATIENT
    //         };

    //         try {
    //             const userCreationResult = await firstValueFrom(
    //                 this.authServiceProxy.send<ProxyMessage<string>, RegisterUserDto>('user.creation', payload as any)
    //             );
    //             if (userCreationResult && 'error' in userCreationResult) {
    //                 throw new RpcException(userCreationResult);
    //             }
    //             const userId = userCreationResult.payload;
    //             if (!userId) throw new InternalServerErrorException('Auth service did not return user id');
    //             const patient = this.patientRepository.create({ ...data, id: userId });
    //             const savedPatient = await this.patientRepository.save(patient);
    //             const patientNutritionist = this.patientNutritionistRepository.create({
    //                 patientId: savedPatient.id,
    //                 nutritionistId: data.nutritionistId
    //             });
    //             await this.patientNutritionistRepository.save(patientNutritionist);
    //             return savedPatient;
    //         } catch (error: any) {
    //             // console.log('Error during patient creation, checking if patient exists:', error.error?.detail || error);
    //             if (error?.error?.detail?.includes("An User with this email already exists")) {
    //                 const existingPatient = await this.patientRepository.findOneBy({ email: data.email }) || await this.patientRepository.findOneBy({ documentNumber: data.documentNumber });
    //                 if (existingPatient) {
    //                     const existingRelation = await this.patientNutritionistRepository.findOneBy({
    //                         patientId: existingPatient.id,
    //                         nutritionistId: data.nutritionistId
    //                     });
    //                     if (existingRelation) {
    //                         throw new ConflictException('Patient already registered');
    //                     }
    //                     const patientNutritionist = this.patientNutritionistRepository.create({
    //                         patientId: existingPatient.id,
    //                         nutritionistId: data.nutritionistId
    //                     });
    //                     await this.patientNutritionistRepository.save(patientNutritionist);
    //                     return existingPatient;
    //                 } else {
    //                     console.log(error);
    //                     throw new InternalServerErrorException('Patient not found after failed creation');
    //                 }
    //             }
    //             throw error;
    //         }
    //     } catch (error: any) {
    //         if (!(error instanceof ConflictException)) {
    //             await firstValueFrom(
    //                 this.authServiceProxy.send<boolean, string>(proxyPattern.user.deletionByEmail, data.email!)
    //             );
    //         }

    //         throw error;
    //     }
    // }

    async createOne(data: Partial<Patient> & { email: string, nutritionistId: string }): Promise<any> {
        const userPayload = {
            email: data.email,
            password: data.documentNumber!.replace(/[.\-\s]/g, ''),
            role: UserRole.PATIENT
        }

        const createdUser = await sendProxyMessage<
            ProxyMessage<typeof proxyPattern.user.creation.response>,
            typeof proxyPattern.user.creation.payload
        >({
            proxy: this.authServiceProxy,
            pattern: proxyPattern.user.creation.key,
            data: userPayload,
            options: {
                rawResponse: true,
                dontThrowIfError: true,
            }
        });

        
        try {
            if (createdUser && "error" in createdUser) {
                //Patient maybe already exists
                if (createdUser.detail.includes(errorMessagePattern.auth.emailAlreadyExists.fn())) {
                    const existingPatient =
                        await this.patientRepository.findOneBy({ email: data.email }) ||
                        await this.patientRepository.findOneBy({ documentNumber: data.documentNumber });
                    if (existingPatient) {
                        const existingRelation = await this.patientNutritionistRepository.findOneBy({
                            patientId: existingPatient.id,
                            nutritionistId: data.nutritionistId
                        });
                        if (existingRelation) { //Patient is already registered with this nutritionist
                            throw new ConflictException(errorMessagePattern.patient.alreadyRegisteredWithNutritionist.key);
                        }
                        const patientNutritionist = this.patientNutritionistRepository.create({
                            patientId: existingPatient.id,
                            nutritionistId: data.nutritionistId
                        });
                        await this.patientNutritionistRepository.save(patientNutritionist);
                        return existingPatient;
                    } else {
                        console.log(error);
                        throw new InternalServerErrorException(errorMessagePattern.patient.patientNotFoundAfterFailedCreation.key);
                    }

                } else {
                    throw new RpcException(createdUser);
                }
            }

            console.log('[Patient-Service] Created user payload:', createdUser);

            const { id } = createdUser.payload;
            if (!id) {
                throw new InternalServerErrorException(
                    errorMessagePattern
                        .auth
                        .didntReturnAValidId
                        .fn()
                );
            }

            const patient = this.patientRepository.create({ ...data, id });
            const savedPatient = await this.patientRepository.save(patient);
            const patientNutritionist = this.patientNutritionistRepository.create({
                patientId: savedPatient.id,
                nutritionistId: data.nutritionistId
            });
            await this.patientNutritionistRepository.save(patientNutritionist);
            return savedPatient;
        } catch (error: any) {
            if (!(error instanceof ConflictException)) {
                await sendProxyMessage<
                    typeof proxyPattern.user.deletionByEmail.response,
                    typeof proxyPattern.user.deletionByEmail.payload
                >({
                    proxy: this.authServiceProxy,
                    pattern: proxyPattern.user.deletionByEmail.key,
                    data: { email: data.email! },
                });
            }

            throw error;
        }
    }

    async updateOne(query: any, data: Partial<Patient>): Promise<Patient | null> {
        try {
            const result = await this.patientRepository.update(query, data);
            if (result.affected === 0) throw new NotFoundException(errorMessagePattern.patient.notFound.key);
            return await this.patientRepository.findOneBy(query);
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
                    throw new InternalServerErrorException(errorMessagePattern.patient.failedToUpdate.fn(error));
            }
        }
    }

    async softDelete(patient: Patient): Promise<Patient> {
        patient.documentNumber = '';
        patient.email = '';
        return await this.patientRepository.save(patient);
    }

    async hardDelete(patient: Patient): Promise<Patient> {
        return await this.patientRepository.remove(patient);
    }

    async deleteOne(query: any): Promise<void> {
        try {
            const result = await this.patientRepository.delete(query);
            if (result.affected === 0) throw new NotFoundException(errorMessagePattern.patient.notFound.key);
        } catch (error) {

        }
    }

    async findAllFromNutritionist(nutritionistId: string) {
        console.log('Finding all patients for nutritionistId:', nutritionistId);
        const patients = await this.patientRepository
            .createQueryBuilder('patient')
            .innerJoinAndSelect('patient.nutritionists', 'patientNutritionist')
            .where('patientNutritionist.nutritionistId = :nutritionistId', { nutritionistId })
            .select([
                'patient.id',
                'patient.name',
                'patient.email'
            ])
            .getMany();

        return patients;
    }

    private async applyIncludes(includes: PatientIncludeOptions, foundPatients: Patient[]): Promise<Patient[]> {
        if (includes?.includeNutritionists) {
            const treatedPatients: TreatedPatient[] = [];
            for (const patient of foundPatients) {
                treatedPatients.push(await this.formatPatientWithNutritionists(patient));
            }
            foundPatients = treatedPatients as unknown as Patient[];
        }
        if (includes?.includeDiets) {
            const treatedPatients: TreatedPatient[] = [];
            for (const patient of foundPatients) {
                //For bulk operations, load meals and foods will be too expensive on perrformance
                treatedPatients.push(await this.formatPatientWithDiets(patient, {
                    includeFoods: includes.includeFoods,
                    includeMeals: includes.includeMeals
                }));
            }
            foundPatients = treatedPatients as unknown as Patient[];
        }
        return foundPatients;
    }

    async formatPatientWithNutritionists(patient: Patient): Promise<any> {
        const nutritionists = patient?.nutritionists?.map(n => n.nutritionistId) || [];
        let nutritionistsDetails: Partial<Nutritionist>[] = [];
        if (nutritionists && nutritionists.length > 0) {
            let proxyResponse = await sendProxyMessage<
                typeof proxyPattern.nutritionist.getManyByIds.response,
                typeof proxyPattern.nutritionist.getManyByIds.payload
            >({
                proxy: this.nutritionistProxy,
                pattern: proxyPattern.nutritionist.getManyByIds.key,
                data: { 
                    ids: nutritionists,
                    options: {
                        removeKeys: ['documentNumber', 'documentType']
                    }
                },
                options: {
                    retry: { count: 3, delay: 2000 }
                }
            });

            nutritionistsDetails = proxyResponse.map(n => {
                const { id, ...rest } = n;
                return {
                    ...rest,
                    nutritionistId: id,
                }
            });

        }
        return {
            ...patient,
            nutritionists: nutritionistsDetails
        };
    }

    async formatPatientWithDiets(patient: Patient, includes: DietIncludeOptions): Promise<any> {
        const diets = await sendProxyMessage<
            typeof proxyPattern.diet.getAll.response,
            typeof proxyPattern.diet.getAll.payload
        >({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.getAll.key,
            data: {
                where: {
                    patientId: patient.id
                },
                includes
            },
            options: {
                retry: { count: 3, delay: 2000 }
            }
        });

        console.log(diets);

        return {
            ...patient,
            diets
        };
    }

    async formatPatientWithWeight(patient: Patient): Promise<Patient> {
        return patient;
    }

}
