import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import {
    AdminManagementLevel,
    NutritionistManagementLevel,
    PatientManagementLevel,
    DietManagementLevel,
    RecordManagementLevel,
    GameManagementLevel,
    LogManagementLevel

} from './manage';

@Entity('admin')
export class Admin {
    @PrimaryColumn('uuid')
    id: string;

    @Column({
        default: true
    })
    canBeDeleted: boolean;

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date

    @OneToOne(() => AdminManagementLevel, { cascade: true, eager: true })
    adminManagementLevel: AdminManagementLevel;

    @OneToOne(() => NutritionistManagementLevel, { cascade: true, eager: true })
    nutritionistManagementLevel: NutritionistManagementLevel;

    @OneToOne(() => PatientManagementLevel, { cascade: true, eager: true })
    patientManagementLevel: PatientManagementLevel;

    @OneToOne(() => DietManagementLevel, { cascade: true, eager: true })
    dietManagementLevel: DietManagementLevel;

    @OneToOne(() => RecordManagementLevel, { cascade: true, eager: true })
    recordManagementLevel: RecordManagementLevel;

    @OneToOne(() => GameManagementLevel, { cascade: true, eager: true })
    gameManagementLevel: GameManagementLevel;

    @OneToOne(() => LogManagementLevel, { cascade: true, eager: true })
    logManagementLevel: LogManagementLevel;

}