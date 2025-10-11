import { PrimaryColumn, Column, Entity } from "typeorm";

@Entity('patient_management_level')
export class PatientManagementLevel {
    @PrimaryColumn({type: 'uuid'})
    id: string;

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