import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { PatientNutritionist } from './patient-nutritionist.entity';
import { WaterGoal } from './water-goal.entity';

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

    @OneToMany(() => WaterGoal, wg => wg.patient)
    waterGoals: WaterGoal[];

    @OneToMany(() => PatientNutritionist, pn => pn.patient)
    nutritionists: PatientNutritionist[];

    hasNutritionist(nutritionistId: string): boolean {
        if(this.nutritionists) {
            return this.nutritionists?.some(n => n.nutritionistId === nutritionistId) ?? false;
        }
        return false;
    }
}