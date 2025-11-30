import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { TrackTemplate } from "./track-template.entity";

@Entity('track_records')
export class TrackRecord {
    @PrimaryColumn()
    trackId: string;

    @PrimaryColumn()
    userId: string;

    @ManyToOne(() => TrackTemplate, (track) => track.records, { onDelete: 'CASCADE' })
    track: TrackTemplate;

    @Column({ 
        type: 'varchar',
        nullable: true
    })
    currentValue?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    lastUpdatedAt: Date;
}