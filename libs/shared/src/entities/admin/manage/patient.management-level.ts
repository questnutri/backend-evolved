import { PrimaryColumn, Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('patient_management_level')
export class PatientManagementLevel {
    @PrimaryColumn({type: 'uuid'})
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewPatients: boolean;

    @Column({
        default: false
    })
    canViewPatientProfile: boolean;

    @Column({
        default: false
    })
    canCreatePatient: boolean;

    @Column({
        default: false
    })
    canUpdatePatient: boolean;

    @Column({
        default: false
    })
    canDeletePatient: boolean;

}