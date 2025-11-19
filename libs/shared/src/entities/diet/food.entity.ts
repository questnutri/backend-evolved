import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Meal } from './meal.entity';

@Entity('foods')
export class Food {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @Column({ type: 'timestamp with time zone' })
    startDate: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    endDate?: Date | null;

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


/**
 * Food startDate should be relative to Meal startDate
 * Food endDate should be relative to Meal endDate or before, if deleted
 * Diet can't be created on past dates
 */
