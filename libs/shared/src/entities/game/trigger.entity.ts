import { Entity, PrimaryColumn, ManyToOne, Column } from "typeorm"
import { ListenerEntity } from "./listener.entity"
import { TrackEntity } from "./track.entity"

@Entity("triggers")
export class TriggerEntity {
    @PrimaryColumn()
    trackId: string

    @PrimaryColumn()
    listenerId: string

    @ManyToOne(() => TrackEntity)
    track: TrackEntity

    @ManyToOne(() => ListenerEntity)
    listener: ListenerEntity

    @Column({ type: 'jsonb', nullable: true })
    activationRules: Record<string, any> | null

    async activate(eventData: Record<string, any>): Promise<any> {
        if (this.activationRules && !this.evaluateActivationRules(eventData)) {
            return null; // Activation rules not satisfied
        }

        // Trigger the associated track
        if (this.track) {
            return this.track.activate(eventData);
        }

        throw new Error('Associated track is missing.');
    }

    private evaluateActivationRules(eventData: Record<string, any>): boolean {
        // Example: Simple rule evaluation (extend this as needed)
        for (const [key, value] of Object.entries(this.activationRules || {})) {
            if (eventData[key] !== value) {
                return false;
            }
        }
        return true;
    }
}