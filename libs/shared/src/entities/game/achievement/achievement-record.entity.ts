import { 
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn
} from "typeorm";
import { AchievementTemplate } from "./achievement-template.entity";

@Entity('achievement_records')
export class AchievementRecord {
    @PrimaryColumn()
    achievementId: string;

    @PrimaryColumn()
    userId: string;

    @ManyToOne(() => AchievementTemplate, (achievement) => achievement.records)
    achievement: AchievementTemplate;

    @CreateDateColumn()
    unlockedAt: Date
}