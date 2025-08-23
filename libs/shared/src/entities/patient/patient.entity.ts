import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { PatientNutritionist } from './patient-nutritionist.entity';

@Entity('patients')
export class Patient {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({
        unique: true,
    })
    documentNumber: string;

    @OneToMany(() => PatientNutritionist, pn => pn.patient)
    nutritionists: PatientNutritionist[];
}
