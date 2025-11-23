import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Food } from './food.entity';
import { Diet } from './diet.entity';
import type { RepeatConfiguration } from '../../types/repeat-configuration';

@Entity('meals')
export class Meal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @ManyToOne(() => Diet, (diet) => diet.meals)
    diet: Diet;

    @OneToMany(() => Food, (food) => food.meal)
    foods: Food[];

    @Column("jsonb")
    repeatConfiguration: RepeatConfiguration;

    @Column()
    hour?: string;

    @Column({
        type: 'varchar',
        nullable: true
    })
    description?: string;

    // --- TEMPORAL VERSIONING FIELDS ---
    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    startDate: Date | null; // The date this version becomes effective

    @Column({ type: 'timestamp with time zone', nullable: true })
    endDate?: Date | null; // The date this version is superseded (exclusive end date)
    // ----------------------------------

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    isPatientRelated(patientId: string): boolean {
        return this.diet.patientId === patientId;
    }

    isNutritionistRelated(nutritionistId: string): boolean {
        return this.diet.nutritionistId === nutritionistId;
    }
}