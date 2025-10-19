import { PrimaryColumn, Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Admin } from "../admin.entity";


@Entity('game_management_level')
export class GameManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => Admin, admin => admin.adminManagementLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    admin: Admin;

    @Column({
        default: false
    })
    canViewGameDetails: boolean;

    @Column({
        default: false
    })
    canViewAchievements: boolean;

    @Column({
        default: false
    })
    canCreateAchievement: boolean;

    @Column({
        default: false
    })
    canUpdateAchievement: boolean;

    @Column({
        default: false
    })
    canDeleteAchievement: boolean;

}