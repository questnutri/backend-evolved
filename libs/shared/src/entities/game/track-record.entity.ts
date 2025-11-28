import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { TrackEntity } from "./track.entity";

@Entity('track_records')
export class TrackRecord {
    @PrimaryColumn()
    trackId: string;

    @PrimaryColumn()
    userId: string;

    @ManyToOne(() => TrackEntity, (track) => track.records, { onDelete: 'CASCADE' })
    track: TrackEntity;

    @Column({ type: 'jsonb', nullable: true })
    currentValue: any;

    updateValue(eventData: Record<string, any>): any {
        if (!this.track || !this.track.config) {
            throw new Error('Track configuration is missing.');
        }

        const config = this.track.config;

        if ('conditionRule' in config && config.conditionRule) {
            const conditionsMet = this.evaluateConditions(config.conditionRule, eventData);
            if (!conditionsMet) {
                return this.currentValue;
            }
        }

        switch (this.track.type) {
            case 'COUNTER':
                this.currentValue = this.updateCounter(eventData);
                break;
            case 'PROPERTY_VALUE':
                this.currentValue = this.updatePropertyValue(eventData);
                break;
            default:
                throw new Error(`Unsupported track type: ${this.track.type}`);
        }

        return this.currentValue;
    }

    private evaluateConditions(conditionRule: Record<string, any>, eventData: Record<string, any>): boolean {
        for (const [key, value] of Object.entries(conditionRule)) {
            if (eventData[key] !== value) {
                return false;
            }
        }
        return true;
    }

    private updateCounter(eventData: Record<string, any>): number {
        const config = this.track.config as any;
        const incrementValue = config.incrementValue || 1;
        return (this.currentValue || 0) + incrementValue;
    }

    private updatePropertyValue(eventData: Record<string, any>): any {
        const config = this.track.config as any;
        const propertyValue = eventData[config.path];

        switch (config.aggregation) {
            case 'SUM':
                return (this.currentValue || 0) + propertyValue;
            case 'MAX':
                return this.currentValue !== undefined ? Math.max(this.currentValue, propertyValue) : propertyValue;
            case 'MIN':
                return this.currentValue !== undefined ? Math.min(this.currentValue, propertyValue) : propertyValue;
            case 'LAST':
                return propertyValue;
            default:
                throw new Error(`Unsupported aggregation type: ${config.aggregation}`);
        }
    }
}