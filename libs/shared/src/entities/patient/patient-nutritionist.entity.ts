import { Entity, PrimaryColumn, ManyToOne, JoinColumn, DeleteDateColumn, Column } from 'typeorm';
import { Patient } from './patient.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('patient_nutritionist')
export class PatientNutritionist {
    @PrimaryColumn({ type: 'uuid' })
    patientId: string;

    @PrimaryColumn({ type: 'uuid' })
    nutritionistId: string;

    @DeleteDateColumn()
    deletedAt?: Date | null;

    @ManyToOne(() => Patient, patient => patient.nutritionists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column({
        type: 'varchar',
        nullable: true
    })
    @ApiProperty({
        description: 'Patient goals. E.g., Lose weight, Gain muscle mass',
        example: 'Lose weight, Gain muscle mass',
        required: false
    })
    goals?: string | null;

    @ApiProperty({
        description: 'Medical conditions of the patient',
        example: 'Diabetes, Hypertension',
        required: false
    })
    @Column({
        type: 'varchar',
        nullable: true
    })
    medicalConditions?: string | null;

    @Column({
        type: 'varchar',
        nullable: true
    })
    @ApiProperty({
        description: 'Patient preferences. E.g., Dietary restrictions, food allergies',
        example: 'Vegetarian, Lactose intolerant',
        required: false
    })
    preferences?: string | null;

    @Column({
        type: 'varchar',
        nullable: true
    })
    @ApiProperty({
        description: 'Additional notes about the patient',
        example: 'Patient prefers morning consultations',
        required: false
    })
    notes?: string | null;

}