import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TrackTemplate } from "../track";
import { AchievementRecord } from "./achievement-record.entity";
import type { i18n } from "../../../interfaces";
import { AchievementTemplateInfo } from "../../../dto";
import { AchievementRarity } from "../../../enums";

@Entity('achievement_templates')
export class AchievementTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('jsonb')
    i18n: i18n<AchievementTemplateInfo>;

    @Column({
        type: 'enum',
        enum: AchievementRarity,
        default: AchievementRarity.COMMON
    })
    rarity: AchievementRarity;

    @Column({
        type: 'varchar',
        nullable: true
    })
    icon?: string;

    @Column()
    trackId: string;

    @ManyToOne(() => TrackTemplate, (track) => track.achievements)
    track: TrackTemplate;

    @Column()
    targetValue: string;

    @OneToMany(() => AchievementRecord, (record) => record.achievement)
    records: AchievementRecord[];
}