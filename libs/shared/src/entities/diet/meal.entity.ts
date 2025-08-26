import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Food } from './food.entity';
import { Diet } from './diet.entity';

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

    @Column("text", { array: true })
    daysOfWeek: string[];

    @Column()
    hour?: string;

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
