import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole, RegisterUserDto, CreatePatientDto, Patient, AUTH_SERVICE_PROXY_NAME, PatientNutritionist, ServiceContract, KeysOf, ProxyMessage } from '@backend-evolved/shared';
import { firstValueFrom } from 'rxjs';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class PatientService implements ServiceContract<Patient> {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,
        // @InjectRepository(Nutritionist)
        // private readonly nutritionistRepository: Repository<Nutritionist>,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
    ) { }

    async findAll(query: { [key: string]: any } = {}) {
        return await this.patientRepository.find({
            where: query
        });
    }

    async findOne(query: KeysOf<Patient>): Promise<Patient | null> {
        const patient = await this.patientRepository.findOne({
            where: query,
            relations: ['patient_nutritionist']
        });
        return patient;
    }

    async createOne(data: Partial<Patient>): Promise<Patient> {
        // Cast data to CreatePatientDto for compatibility
        const patientData = data as CreatePatientDto;
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
                if(userCreationResult && 'error' in userCreationResult) {
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
            } catch (error) {
                // console.log('Error during patient creation, checking if patient exists:', error);
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
        } catch (error: any) {
            // console.log(`Patient error on creation: `, error);
            await firstValueFrom(
                this.authServiceProxy.send<boolean, string>('user.deletion', patientData.email)
            );

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

}
