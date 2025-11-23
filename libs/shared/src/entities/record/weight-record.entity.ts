import { UserRole } from "src/enums";
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";


class RegisteredBy {
    role: UserRole
    userId: string
}

@Entity('weight_records')
export class WeightRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    valueInKg: string;

    @Column({ type: 'jsonb' })
    registeredBy: RegisteredBy

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    patientId: string;
}