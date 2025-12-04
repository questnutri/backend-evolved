import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Trigger } from "../trigger/trigger.entity";
import { TrackRecord } from "./track-record.entity";
import { ApiProperty } from "@nestjs/swagger";
import type { TrackConfiguration } from "./track-configuration";
import { AchievementTemplate } from "../achievement";

@Entity('track_templates')
export class TrackTemplate {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'The unique identifier of the track template'
    })
    id: string;

    @Column()
    @ApiProperty({
        example: 'Experience Points',
        description: 'The name of the track template'
    })
    name: string;

    @Column({
        type: 'varchar',
        nullable: true
    })
    @ApiProperty({
        example: 'Tracks the experience points earned by the user',
        description: 'A brief description of the track template'
    })
    description?: string;

    @Column('jsonb')
    configuration: TrackConfiguration;

    @OneToMany(() => Trigger, (trigger) => trigger.track)
    triggers: Trigger[];

    @OneToMany(() => TrackRecord, (trackRecord) => trackRecord.track)
    records: TrackRecord[];

    @OneToMany(() => AchievementTemplate, (achievement) => achievement.track)
    achievements: AchievementTemplate[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;

    updateValue(record: TrackRecord, payload: any): any {
        return record;
    }
}