import { RecordType } from "../../enums";
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity('water-records')
export class WaterRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    patientId: string;

    @Column()
    nutritionistId: string;

    @Column()
    amountInMl: string;

    @Column({
        type: 'enum',
        enum: RecordType,
        default: RecordType.ADD
    })
    operation: RecordType

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'time' })
    registerHour: string;

    @Column()
    currentDailyWaterGoal: string;

    @Column({ type: 'timestamp' })
    relativeDate: Date;
}