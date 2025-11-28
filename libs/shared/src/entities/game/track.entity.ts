import { TrackType } from "../../enums";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TriggerEntity } from "./trigger.entity";
import { TrackRecord } from "./track-record.entity";

export interface CounterTrackConfig {
    groupingPeriod?: 'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
    uniquenessKey?: string
    incrementValue?: number
    conditionRule?: Record<string, any>
}

export interface PropertyValueTrackConfig {
    path: string
    aggregation: 'SUM' | 'MAX' | 'MIN' | 'LAST'
    groupingPeriod?: 'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
    conditionRule?: Record<string, any>
}

export interface CustomExpressionTrackConfig {
    expression: string
}

export type TrackConfig =
    | CounterTrackConfig
    | PropertyValueTrackConfig
    | CustomExpressionTrackConfig

@Entity('tracks')
export class TrackEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: TrackType,
        default: TrackType.COUNTER
    })
    type: TrackType;

    @Column({ type: "jsonb", nullable: true })
    config: TrackConfig | null;

    @OneToMany(() => TriggerEntity, (trigger) => trigger.track)
    triggers: TriggerEntity[];

    @OneToMany(() => TrackRecord, (trackRecord) => trackRecord.track)
    records: TrackRecord[];

    activate(eventData: Record<string, any>): any {
        if (!this.config) {
            throw new Error('Track configuration is missing.');
        }

        // Evaluate conditions if present
        if ('conditionRule' in this.config && this.config.conditionRule) {
            const conditionsMet = this.evaluateConditions(this.config.conditionRule, eventData);
            if (!conditionsMet) {
                return null; // Conditions not met, no update
            }
        }

        // Update value based on track type
        switch (this.type) {
            case TrackType.COUNTER:
                return this.updateCounter(eventData);
            case TrackType.PROPERTY_VALUE:
                return this.updatePropertyValue(eventData);
            default:
                throw new Error(`Unsupported track type: ${this.type}`);
        }
    }

    private evaluateConditions(conditionRule: Record<string, any>, eventData: Record<string, any>): boolean {
        // Example: Simple condition evaluation (extend this as needed)
        for (const [key, value] of Object.entries(conditionRule)) {
            if (eventData[key] !== value) {
                return false;
            }
        }
        return true;
    }

    private updateCounter(eventData: Record<string, any>): number {
        const config = this.config as CounterTrackConfig;
        const incrementValue = config.incrementValue || 1;
        // Example: Increment logic (extend this as needed)
        return incrementValue;
    }

    private updatePropertyValue(eventData: Record<string, any>): any {
        const config = this.config as PropertyValueTrackConfig;
        const propertyValue = eventData[config.path];
        if (config.aggregation === 'SUM') {
            return propertyValue; // Example: Add logic to sum values
        }
        if (config.aggregation === 'MAX') {
            return propertyValue; // Example: Add logic to find max value
        }
        if (config.aggregation === 'MIN') {
            return propertyValue; // Example: Add logic to find min value
        }
        if (config.aggregation === 'LAST') {
            return propertyValue; // Example: Return the last value
        }
        throw new Error(`Unsupported aggregation type: ${config.aggregation}`);
    }
}