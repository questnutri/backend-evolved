import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Admin } from "../admin.entity";

@Entity('admin_management_level')
export class AdminManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canToggleAdminImpersonation: boolean;

    @Column({
        default: false
    })
    canViewAdmins: boolean;

    @Column({
        default: false
    })
    canViewAdminProfile: boolean;

    @Column({
        default: false
    })
    canCreateAdmin: boolean;

    @Column({
        default: false
    })
    canUpdateAdmin: boolean;

    @Column({
        default: false
    })
    canDeleteAdmin: boolean;

    @Column({
        default: false
    })
    canViewManagementLevels: boolean;

    @Column({
        default: false
    })
    canGrantAdminPermissions: boolean;


    @Column({
        default: false
    })
    canCreateNotifications: boolean;
}