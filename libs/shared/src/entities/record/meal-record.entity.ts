import { Field, ID } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('meal-records')
export class MealRecord {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID, { nullable: true })
    id: string;

    @CreateDateColumn()
    @Field({ nullable: true })
    createdAt: Date;

    @UpdateDateColumn()
    @Field({ nullable: true })
    updatedAt: Date;

    @Column()
    @Field()
    dietId: string;

    @Column()
    @Field()
    mealId: string;

    @Column()
    @Field()
    patientId: string;

    @Column()
    @Field()
    nutritionistId: string;

    @Column({ default: true })
    @Field()
    isCompleted: boolean;

    @Column({ type: 'timestamp' })
    @Field()
    mealRelativeDate: Date;

    @Column()
    @Field()
    mealRepeatDay: number;
}