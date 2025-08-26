import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Meal } from './meal.entity';

@Entity('diets')
export class Diet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: true
    })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    patientId: string;

    @Column()
    @Exclude()
    nutritionistId: string;

    @OneToMany(() => Meal, (meal) => meal.diet)
    meals: Meal[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
