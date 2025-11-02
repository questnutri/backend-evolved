import {
    Column,
    CreateDateColumn,
    Entity,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
    JoinColumn
} from 'typeorm';
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

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date

    @OneToOne(() => AdminManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    adminManagementLevel: AdminManagementLevel;

    @OneToOne(() => NutritionistManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    nutritionistManagementLevel: NutritionistManagementLevel;

    @OneToOne(() => PatientManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    patientManagementLevel: PatientManagementLevel;

    @OneToOne(() => DietManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    dietManagementLevel: DietManagementLevel;

    @OneToOne(() => RecordManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    recordManagementLevel: RecordManagementLevel;

    @OneToOne(() => GameManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    gameManagementLevel: GameManagementLevel;

    @OneToOne(() => LogManagementLevel, management => management.admin, {
        cascade: true,
        eager: true
    })
    @JoinColumn({ name: 'id' })
    logManagementLevel: LogManagementLevel;

}