import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TrackTemplate } from "../track";
import { AchievementRecord } from "./achievement-record.entity";

@Entity('achievement_templates')
export class AchievementTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @Column()
    trackId: string;

    @ManyToOne(() => TrackTemplate, (track) => track.achievements)
    track: TrackTemplate;

    @Column()
    targetValue: string;

    @OneToMany(() => AchievementRecord, (record) => record.achievement)
    records: AchievementRecord[];
}