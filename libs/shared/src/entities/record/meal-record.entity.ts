import { 
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

@Entity('meal-records')
export class MealRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    dietId: string;

    @Column()
    mealId: string;

    @Column()
    expectedHour: string;

    @Column({ type: 'time', nullable: true })
    conclusionHour?: string;

    @Column()
    patientId: string;

    @Column()
    nutritionistId: string;

    @Column({ default: true })
    isCompleted: boolean;

    @Column({ type: 'timestamp' })
    relativeDate: Date;
}