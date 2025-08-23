import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole, RegisterUserDto, CreatePatientDto, Patient, AUTH_SERVICE_PROXY_NAME, PatientNutritionist } from '@backend-evolved/shared';
import { firstValueFrom } from 'rxjs';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class PatientService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        @InjectRepository(PatientNutritionist)
        private readonly patientNutritionistRepository: Repository<PatientNutritionist>,
        // @InjectRepository(Nutritionist)
        // private readonly nutritionistRepository: Repository<Nutritionist>,
        @Inject(AUTH_SERVICE_PROXY_NAME) private readonly authServiceProxy: ClientProxy,
    ) { }

    async create(data: CreatePatientDto) {
        try {
            const payload = {
                email: data.email,
                password: data.documentNumber,
                role: UserRole.PATIENT
            };
            try {
                const userId = await firstValueFrom(
                    this.authServiceProxy.send<string, RegisterUserDto>('user.creation', payload)
                );
                if (!userId) throw new InternalServerErrorException('Auth service did not return user id');
                const patient = this.patientRepository.create({ ...data, id: userId });
                const savedPatient = await this.patientRepository.save(patient);
                const patientNutritionist = this.patientNutritionistRepository.create({
                    patientId: savedPatient.id,
                    nutritionistId: data.nutritionistId
                });
                await this.patientNutritionistRepository.save(patientNutritionist);
                return savedPatient;
            } catch (error) {
                const existingPatient = await this.patientRepository.findOneBy({ email: data.email });
                if (existingPatient) {
                    const existingRelation = await this.patientNutritionistRepository.findOneBy({
                        patientId: existingPatient.id,
                        nutritionistId: data.nutritionistId
                    });
                    if (existingRelation) {
                        throw new ConflictException('Patient already registered');
                    }
                    const patientNutritionist = this.patientNutritionistRepository.create({
                        patientId: existingPatient.id,
                        nutritionistId: data.nutritionistId
                    });
                    await this.patientNutritionistRepository.save(patientNutritionist);
                    return existingPatient;
                }
            }
        } catch (error: any) {
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
                    console.error('Unexpected error during patient creation:', error);
                    throw new InternalServerErrorException('Failed to create patient: ' + (error?.detail ?? 'unknown'));
            }
        }
    }

    async findAll(query: { [key: string]: any } = {}) {
        return await this.patientNutritionistRepository.find({
            where: query
        });
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
