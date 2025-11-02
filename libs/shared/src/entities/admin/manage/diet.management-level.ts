import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('diet_management_level')
export class DietManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewDiets: boolean;

    @Column({
        default: false
    })
    canViewDietDetails: boolean;

}