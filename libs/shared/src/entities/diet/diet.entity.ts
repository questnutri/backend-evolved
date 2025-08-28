import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Meal } from './meal.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('diets')
export class Diet {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID, { nullable: true })
    id: string;

    @Column({
        nullable: true
    })
    @Field({ nullable: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    description: string;

    @Column()
    @Field()
    patientId: string;

    @Column()
    @Exclude()
    nutritionistId: string;

    @OneToMany(() => Meal, (meal) => meal.diet)
    @Field(() => [Meal], { nullable: true })
    meals: Meal[];

    @CreateDateColumn()
    @Field({ nullable: true })
    createdAt: Date;

    @UpdateDateColumn()
    @Field({ nullable: true })
    updatedAt: Date;
}
