import { Column, CreateDateColumn, Entity } from "typeorm";

@Entity('achievement_records')
export class AchievementEntity {
    //Primary key == userId and + achievementId

    @CreateDateColumn()
    unlockedAt: Date

    @Column()
    trackId: string;
}