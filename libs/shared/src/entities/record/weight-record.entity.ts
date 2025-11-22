import { 
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

@Entity('weight_records')
export class WeightRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    valueInKg: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    patientId: string;
}