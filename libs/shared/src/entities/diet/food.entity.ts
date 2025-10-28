import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Meal } from './meal.entity';

@Entity('foods')
export class Food {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    isActive: boolean = true;

    @ManyToOne(() => Meal, (meal) => meal.foods)
    meal: Meal;

    @Column({ nullable: true })
    quantity?: string;

    @Column({ nullable: true })
    portion?: string;

    @Column()
    alimentId?: string;

    @Column({ nullable: true })
    description?: string;

    // --- TEMPORAL VERSIONING FIELDS ---
    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    validFrom: Date | null; // The date this version becomes effective

    @Column({ type: 'timestamp with time zone', nullable: true })
    validTo?: Date | null; // The date this version is superseded (exclusive end date)
    // ----------------------------------

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    isPatientRelated(patientId: string): boolean {
        // Must load relations to access diet (meal.diet)
        return this.meal.diet.patientId === patientId;
    }

    isNutritionistRelated(nutritionistId: string): boolean {
        // Must load relations to access diet (meal.diet)
        return this.meal.diet.nutritionistId === nutritionistId;
    }
}