import {
    ConflictException, Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
    UserRole, Patient,
    AUTH_SERVICE_PROXY_NAME,
    PatientNutritionist,
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
    removePropertiesForMany,
    SchedulerHelper,
    LevelOfActivity,
    ListResponse,
    normalizeToList,
    RECORD_SERVICE_PROXY_NAME, RequestedBy,
    removePropertyForOne
} from '@backend-evolved/shared';
import { In, Repository } from 'typeorm';
import { error } from 'console';

export type TreatedPatient = Partial<Omit<Patient, 'nutritionists'>> & { nutritionists: Nutritionist[] };

@Injectable()
export class PatientService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,
        @Inject(NUTRITIONIST_SERVICE_PROXY_NAME) private readonly nutritionistProxy: ClientProxy,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
        @Inject(DIET_SERVICE_PROXY_NAME) private readonly dietServiceProxy: ClientProxy,
        @Inject(RECORD_SERVICE_PROXY_NAME) private readonly recordServiceProxy: ClientProxy,
    ) { }

    async findAll(
        requestedBy: RequestedBy,
        find?: PatientFindOptions & PaginationQuery
    ): Promise<ListResponse<Patient>> {
        let page = find?.page || 1;
        let limit = find?.limit || 20;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;

        let { where } = find || {};

        let [foundPatients, total] = await this.patientRepository.findAndCount({
            where: {
                ...where,
                ...buildFiltering(find?.filter)
            },
            relations: find?.relations || ['nutritionists'],
            select: find?.select,
            skip: (page && limit) ? (page - 1) * limit : undefined,
            take: limit || undefined,
        });

        foundPatients = await this.applyIncludeOptionsOnMany({
            ...find, includeFoods: false, includeMeals: false
        },
            foundPatients,
            requestedBy
        );
        foundPatients = removePropertiesForMany(foundPatients, find?.removeKeys);

        return normalizeToList(foundPatients, total, page, limit);
    }

    async findManyByIds(
        ids: string[],
        requestedBy: RequestedBy,
        options?: PatientFindOptions & PaginationQuery
    ): Promise<ListResponse<Patient>> {
        if (options) {
            options['where'] = {
                id: In(ids),
            }
        }
        return await this.findAll(requestedBy, options);
    }

    async findOne(
        requestedBy: RequestedBy,
        options?: PatientFindOptions
    ): Promise<Patient> {
        let where = {
            ...options?.where,
            deletedAt: null
        }

        let patient = await this.patientRepository.findOne({
            where,
            relations: options?.relations || ['nutritionists'],
            withDeleted: true,
        });
        if (!patient) {
            throw new NotFoundException(
                errorMessagePattern
                    .patient
                    .notFound
                    .fn()
            );
        }

        patient = await this.applyIncludeOptionsOnOne({
            ...options,
            includeLastWeight: true
        },
            patient,
            requestedBy
        );
        patient = this.applyHealthCalculation(patient!);
        patient = removePropertiesForMany([patient!], options?.removeKeys)[0];

        return patient!;

    }

    async createOne(data: Partial<Patient> & { email: string, nutritionistId: string }): Promise<any> {
        data.documentNumber = data.documentNumber!.replace(/[.\-\s]/g, '');
        const userPayload = {
            email: data.email,
            password: data.documentNumber,
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
                retry: {
                    count: 3, delay: 50
                }
            }
        });


        try {
            if (createdUser && "error" in createdUser) {
                //Patient maybe already exists
                if (createdUser.detail.includes(errorMessagePattern.auth.emailAlreadyExists.fn())) {
                    let existingPatient =
                        await this.patientRepository.findOneBy({ email: data.email }) ||
                        await this.patientRepository.findOneBy({ documentNumber: data.documentNumber });
                    if (existingPatient) {
                        const existingRelation = await this.patientNutritionistRepository.findOne({
                            where: {
                                patientId: existingPatient.id,
                                nutritionistId: data.nutritionistId
                            },
                            withDeleted: true
                        } );
                        if (existingRelation) { //Patient is already registered with this nutritionist
                            if(existingRelation.deletedAt) {
                                existingRelation.deletedAt = null;
                                await this.patientNutritionistRepository.save(existingRelation);
                                existingPatient = removePropertyForOne(existingPatient, ['deletedAt']);
                                return existingPatient;
                            }
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

            const { id } = createdUser.payload;
            if (!id) {
                throw new InternalServerErrorException(
                    errorMessagePattern
                        .auth
                        .didntReturnAValidId
                        .fn()
                );
            }

            if (data.dateOfBirth) {
                const scheduler = new SchedulerHelper();
                scheduler.setFormat('YYYY-MM-DD');
                if (scheduler.isValidDate(data.dateOfBirth)) {
                    data.dateOfBirth = scheduler.format(scheduler.buildDate({ date: data.dateOfBirth })).toString();
                } else {
                    data.dateOfBirth = null;
                }
            }
            if (!data.levelOfActivity) {
                data.levelOfActivity = LevelOfActivity.ONE;
            }

            const patient = this.patientRepository.create({ ...data, id });
            let savedPatient = await this.patientRepository.save(patient);
            const patientNutritionist = this.patientNutritionistRepository.create({
                patientId: savedPatient.id,
                nutritionistId: data.nutritionistId
            });
            await this.patientNutritionistRepository.save(patientNutritionist);
            savedPatient = removePropertyForOne(savedPatient, ['deletedAt']);
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

    async updateOne(patient: Patient, payload: Partial<Patient>): Promise<Patient> {
        // Removing unupdatable fields
        const { email, documentNumber, ...rest } = payload;
        const updatePayload = { ...rest } as Partial<Patient>;

        this.patientRepository.merge(patient, updatePayload);
        return await this.patientRepository.save(patient);
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
            if (result.affected === 0) throw new NotFoundException(errorMessagePattern.patient.notFound.fn());
        } catch (error) {

        }
    }

    async findAllFromNutritionist(nutritionistId: string) {
        const patients = await this.patientRepository
            .createQueryBuilder('patient')
            .innerJoinAndSelect('patient.nutritionists', 'patientNutritionist')
            .where('patientNutritionist.nutritionistId = :nutritionistId', { nutritionistId })
            .andWhere('patient.deletedAt IS NULL')
            .select([
                'patient.id',
                'patient.name',
                'patient.email'
            ])
            .getMany();

        return patients;
    }

    async applyIncludeOptionsOnOne(
        includes: PatientIncludeOptions,
        patient: Patient,
        requestedBy: RequestedBy
    ): Promise<Patient> {
        let p = patient
        if (
            requestedBy.role !== UserRole.NUTRITIONIST && //always block nutritionists info
            includes?.includeNutritionists
        ) {
            p = await this.formatPatientWithNutritionists(p)
        }
        if (includes?.includeDiets) {
            p = await this.formatPatientWithDiets(p, {
                includeFoods: includes.includeFoods,
                includeMeals: includes.includeMeals
            }, requestedBy)
        }
        if (includes?.includeLastWeight) {
            p = await this.formatPatientWithWeight(p, requestedBy)
        }
        return p
    }

    async applyIncludeOptionsOnMany(
        includes: PatientIncludeOptions,
        foundPatients: Patient[],
        requestedBy: RequestedBy
    ): Promise<Patient[]> {
        const promises = foundPatients.map(p => this.applyIncludeOptionsOnOne(includes, p, requestedBy))
        return await Promise.all(promises)
    }

    async formatPatientWithNutritionists(patient: Patient): Promise<any> {
        const nutritionists = patient?.nutritionists?.map(n => n.nutritionistId) || [];
        let nutritionistsDetails: Partial<Nutritionist>[] = [];
        if (nutritionists && nutritionists.length > 0) {
            nutritionistsDetails = await sendProxyMessage<
                typeof proxyPattern.nutritionist.getManyByIds.response,
                typeof proxyPattern.nutritionist.getManyByIds.payload
            >({
                proxy: this.nutritionistProxy,
                pattern: proxyPattern.nutritionist.getManyByIds.key,
                data: {
                    ids: nutritionists,
                    options: {
                        removeKeys: [
                            'documentNumber',
                            'documentType',
                            'mainAddress',
                            'gender',
                            'deletedAt'
                        ]
                    }
                },
                options: {
                    retry: { count: 3, delay: 2000 }
                }
            });

        }
        return {
            ...patient,
            nutritionists: nutritionistsDetails
        };
    }

    applyHealthCalculation(patient: Patient): Patient {
        const birthYear = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null
        const age = birthYear ? new Date().getFullYear() - birthYear : 0;
        if (patient.heightInCm && (patient as any).lastWeight) {
            const weightKg = (patient as any).lastWeight.valueInKg;
            const imc = this.calculateIMC(weightKg, patient.heightInCm);
            (patient as any).imc = imc || null;
            const tmb = this.calculateTMB(patient.gender || 'FEMALE', weightKg, patient.heightInCm, age);
            (patient as any).tmb = tmb || null;
            if (tmb) {
                const tdee = this.calculateTDEE(tmb, patient.levelOfActivity || LevelOfActivity.ONE);
                (patient as any).tdee = tdee;
            } else {
                (patient as any).tdee = null;
            }
        } else {
            (patient as any).imc = null;
            (patient as any).tmb = null;
            (patient as any).tdee = null;
        }
        return patient;
    }

    private calculateIMC(weightKg: number, heightCm: number): number {
        const h = heightCm / 100
        return parseFloat((weightKg / (h * h)).toFixed(2));
    }

    private calculateTMB(gender: string, weightKg: number, heightCm: number, age: number): number {
        if (gender === 'MALE') {
            return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        }
        return parseFloat((10 * weightKg + 6.25 * heightCm - 5 * age - 161).toFixed(2));
    }

    private calculateTDEE(bmr: number, level: LevelOfActivity): number {
        const factors: Record<string, number> = {
            "1": 1.2,
            "2": 1.375,
            "3": 1.55,
            "4": 1.725,
            "5": 1.9
        }
        return parseFloat((bmr * (factors[level] || 1.2)).toFixed(2));
    }

    async formatPatientWithDiets(
        patient: Patient,
        includes: DietIncludeOptions,
        requestedBy: RequestedBy
    ): Promise<any> {
        let where: any = {
            patientId: patient.id
        }
        if (requestedBy.role === UserRole.NUTRITIONIST) {
            where = {
                ...where,
                nutritionistId: requestedBy.id
            }
        }
        const diets = await sendProxyMessage<
            typeof proxyPattern.diet.getAll.response,
            typeof proxyPattern.diet.getAll.payload
        >({
            proxy: this.dietServiceProxy,
            pattern: proxyPattern.diet.getAll.key,
            data: {
                where,
                includes
            },
            options: {
                retry: { count: 3, delay: 2000 }
            }
        });

        return {
            ...patient,
            diets
        };
    }

    async formatPatientWithWeight(patient: Patient, requestedBy: RequestedBy): Promise<Patient> {
        let weightRecord = await sendProxyMessage<
            typeof proxyPattern.record.weight.getLast.response,
            typeof proxyPattern.record.weight.getLast.payload
        >({
            proxy: this.recordServiceProxy,
            pattern: proxyPattern.record.weight.getLast.key,
            data: {
                patientId: patient.id,
                ctxUser: requestedBy
            }
        });

        if (weightRecord) {
            const { patientId, ...weightData } = weightRecord;
            if (
                weightData &&
                weightData.registeredBy &&
                weightData.registeredBy.role === UserRole.PATIENT
            ) {
                (weightData as any).registeredBy.name = patient.firstName;
            }

            (patient as any)['lastWeight'] = weightData;
        } else {
            (patient as any)['lastWeight'] = null;
        }



        return patient;
    }

}