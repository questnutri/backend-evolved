import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Food } from './food.entity';
import { Diet } from './diet.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ObjectType()
@Entity('meals')
export class Meal {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID, { nullable: true })
    id: string;

    @Column()
    @Field()
    name: string;

    @ManyToOne(() => Diet, (diet) => diet.meals)
    @Field(() => Diet)
    diet: Diet;

    @OneToMany(() => Food, (food) => food.meal)
    @Field(() => [Food], { nullable: true })
    foods: Food[];

    @Column("text", { array: true })
    @Field(() => [String])
    daysOfWeek: string[];

    @Column()
    @Field({ nullable: true })
    hour?: string;

    @CreateDateColumn()
    @Field({ nullable: true })
    createdAt: Date;

    @UpdateDateColumn()
    @Field({ nullable: true })
    updatedAt: Date;

    isPatientRelated(patientId: string): boolean {
        return this.diet.patientId === patientId;
    }

    isNutritionistRelated(nutritionistId: string): boolean {
        return this.diet.nutritionistId === nutritionistId;
    }
}
