import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('admin_management_level')
export class AdminManagementLevel {
    @PrimaryColumn({type: 'uuid'})
    id: string;

    @Column({
        default: false
    })
    canToggleAdminImpersonation: boolean;

    @Column({
        default: false
    })
    canModifyAdminPermissions: boolean;

    @Column({
        default: false
    })
    canViewAdmins: boolean;

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
    canViewOwnProfile: boolean;

}