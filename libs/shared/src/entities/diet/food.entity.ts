import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Meal } from './meal.entity';
import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';

@ObjectType()
@Entity('foods')
export class Food {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID, { nullable: true })
    id: string;

    @ManyToOne(() => Meal, (meal) => meal.foods)
    @Field(() => Meal)
    meal: Meal;

    @Column()
    @Field({ nullable: true })
    quantity: string;

    @Column()
    @Field({ nullable: true })
    unitOfMeasure: string;

    @CreateDateColumn()
    @Field({ nullable: true })
    createdAt: Date;

    @UpdateDateColumn()
    @Field({ nullable: true })
    updatedAt: Date;

    isPatientRelated(patientId: string): boolean {
        return this.meal.diet.patientId === patientId;
    }

    isNutritionistRelated(nutritionistId: string): boolean {
        return this.meal.diet.nutritionistId === nutritionistId;
    }
}
