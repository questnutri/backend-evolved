import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('log_management_level')
export class LogManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewLogs: boolean;
}