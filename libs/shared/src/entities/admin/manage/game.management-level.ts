import { PrimaryColumn, Column, Entity } from "typeorm";

@Entity('diet_management_level')
export class GameManagementLevel {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

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