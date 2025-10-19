import { PrimaryColumn, Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('nutritionist_management_level')
export class NutritionistManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewNutritionists: boolean;

    @Column({
        default: false
    })
    canViewNutritionistProfile: boolean;

    @Column({
        default: false
    })
    canCreateNutritionist: boolean;

    @Column({
        default: false
    })
    canApproveNutritionist: boolean;

    @Column({
        default: false
    })
    canUpdateNutritionist: boolean;

    @Column({
        default: false
    })
    canDeleteNutritionist: boolean;

    @Column({
        default: false
    })
    canViewNutritionistPatients: boolean;

}