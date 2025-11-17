import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('water_goals')
export class WaterGoal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    amountInMl: number;

    @Column({ name: 'patientId', nullable: true })
    patientId: string;

    @ManyToOne(() => Patient, patient => patient.waterGoals)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    nutritionistId: string;

    @CreateDateColumn()
    createdAt: Date;
    
    @Column({ type: 'timestamp', nullable: true })
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date | null;
}