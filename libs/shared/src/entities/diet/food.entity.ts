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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    isPatientRelated(patientId: string): boolean {
        return this.meal.diet.patientId === patientId;
    }

    isNutritionistRelated(nutritionistId: string): boolean {
        return this.meal.diet.nutritionistId === nutritionistId;
    }
}
