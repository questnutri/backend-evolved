import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('patient_nutritionist')
export class PatientNutritionist {
    @PrimaryColumn({ type: 'uuid' })
    patientId: string;

    @PrimaryColumn({ type: 'uuid' })
    nutritionistId: string;

    @ManyToOne(() => Patient, patient => patient.nutritionists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patientId' })
    patient: Patient;
}