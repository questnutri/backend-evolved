import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole, RegisterUserDto, Patient, AUTH_SERVICE_PROXY_NAME, PatientNutritionist, ServiceContract, KeysOf, ProxyMessage, proxyPattern, BodyCreatePatientDto, NUTRITIONIST_SERVICE_PROXY_NAME, Nutritionist, sendProxyMessage } from '@backend-evolved/shared';
import { firstValueFrom } from 'rxjs';
import { QueryFailedError, Repository } from 'typeorm';

export type TreatedPatient = Partial<Omit<Patient, 'nutritionists'>> & { nutritionists: string[] };

@Injectable()
export class PatientService implements ServiceContract<Patient> {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,

        @Inject(NUTRITIONIST_SERVICE_PROXY_NAME) private readonly nutritionistProxy: ClientProxy,
        // @InjectRepository(Nutritionist)
        // private readonly nutritionistRepository: Repository<Nutritionist>,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
    ) { }

    async findAll(query: { [key: string]: any } = {}) {
        return await this.patientRepository.find({
            where: query
        });
    }

    async findOneWhere(
        query: {
            [key: string]: any 
        }): Promise<TreatedPatient> {
        const patient = await this.patientRepository.findOne({
            where: query,
            relations: ['nutritionists']
        });
        if (!patient) throw new NotFoundException('Patient not found');
        return {
            ...patient,
            nutritionists: patient.nutritionists?.map(n => n.nutritionistId) || []
        };
    }

    async createOne(data: Partial<Patient>): Promise<Patient> {
        // Cast data to CreatePatientDto for compatibility
        const patientData = data as BodyCreatePatientDto;
        try {
            const payload = {
                email: patientData.email,
                password: patientData.documentNumber,
                role: UserRole.PATIENT
            };
            try {
                const userCreationResult = await firstValueFrom(
                    this.authServiceProxy.send<ProxyMessage<string>, RegisterUserDto>('user.creation', payload)
                );
                if (userCreationResult && 'error' in userCreationResult) {
                    throw new RpcException(userCreationResult);
                }
                const userId = userCreationResult.payload;
                if (!userId) throw new InternalServerErrorException('Auth service did not return user id');
                const patient = this.patientRepository.create({ ...patientData, id: userId });
                const savedPatient = await this.patientRepository.save(patient);
                const patientNutritionist = this.patientNutritionistRepository.create({
                    patientId: savedPatient.id,
                    nutritionistId: patientData.nutritionistId
                });
                await this.patientNutritionistRepository.save(patientNutritionist);
                return savedPatient;
            } catch (error: any) {
                // console.log('Error during patient creation, checking if patient exists:', error.error?.detail || error);
                if (error?.error?.detail?.includes("An User with this email already exists")) {
                    const existingPatient = await this.patientRepository.findOneBy({ email: patientData.email }) || await this.patientRepository.findOneBy({ documentNumber: patientData.documentNumber });
                    if (existingPatient) {
                        const existingRelation = await this.patientNutritionistRepository.findOneBy({
                            patientId: existingPatient.id,
                            nutritionistId: patientData.nutritionistId
                        });
                        if (existingRelation) {
                            throw new ConflictException('Patient already registered');
                        }
                        const patientNutritionist = this.patientNutritionistRepository.create({
                            patientId: existingPatient.id,
                            nutritionistId: patientData.nutritionistId
                        });
                        await this.patientNutritionistRepository.save(patientNutritionist);
                        return existingPatient;
                    } else {
                        console.log(error);
                        throw new InternalServerErrorException('Patient not found after failed creation');
                    }
                }
                throw error;
            }
        } catch (error: any) {
            if (!(error instanceof ConflictException)) {
                await firstValueFrom(
                    this.authServiceProxy.send<boolean, string>(proxyPattern.user.deletionByEmail, patientData.email)
                );
            }

            throw error;
        }
    }

    async updateOne(query: KeysOf<Patient>, data: Partial<Patient>): Promise<Patient | null> {
        try {
            const result = await this.patientRepository.update(query, data);
            if (result.affected === 0) throw new NotFoundException('Patient not found');
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
                    throw new InternalServerErrorException('Failed to update patient: ' + (error?.detail ?? 'unknown'));
            }
        }
    }

    async deleteOne(query: KeysOf<Patient>): Promise<void> {
        try {
            const result = await this.patientRepository.delete(query);
            if (result.affected === 0) throw new NotFoundException('Patient not found');
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

    private async formatPatientWithNutritionists(patient: Patient): Promise<any> {
        const nutritionists = patient?.nutritionists?.map(n => n.nutritionistId) || [];
        let nutritionistsDetails: Partial<Nutritionist>[] = [];
        if(nutritionists && nutritionists.length > 0) {
            let proxyResponse = await sendProxyMessage<Nutritionist[]>({
                proxy: this.nutritionistProxy,
                pattern: proxyPattern.nutritionist.getManyByIds,
                data: {ids: nutritionists},
                options: {
                    retry: { count: 3, delay: 2000 }
                }
            });
            
            nutritionistsDetails = proxyResponse.map(n => {
                return {
                    nutritionistId: n.id,
                    name: n.name,
                }
            });

        }
        return {
            ...patient,
            nutritionists: nutritionistsDetails
        };
    }

}
