import { Entity, PrimaryColumn, ManyToOne, Column } from "typeorm"
import { ListenerEntity } from "../listener.entity"
import { TrackTemplate } from "../track/track-template.entity"
import { ConditionOperation, TriggerCondition, DateConditionOperation } from "./trigger-condition"
import { SearchSpec } from "../search-spec"
import { PropertyType } from "../property-type.enum"
import { TrackRecord } from "../track"
import { InternalServerErrorException } from "@nestjs/common"
import { errorMessagePattern } from "../../../patterns"
import { castProperty } from "../../../utils"
import { extractDatePart } from "../../../utils"

@Entity("triggers")
export class Trigger {
    @PrimaryColumn()
    trackId: string

    @PrimaryColumn()
    listenerId: string

    @Column({
        type: 'jsonb',
        nullable: true
    })
    conditions: TriggerCondition[] = []

    @ManyToOne(() => TrackTemplate)
    track: TrackTemplate

    @ManyToOne(() => ListenerEntity)
    listener: ListenerEntity

    test(record: TrackRecord | null, log: any) {
        for (const condition of this.conditions) {
            try {
                let mainMapValue: string | number;
                mainMapValue = this.getMappingValue(log, condition);

                let comparisonValue = null;

                if (condition.value) {
                    comparisonValue = condition.value;
                } else if (condition.compare) {
                    let foundAtSource;
                    if (condition.compare.foundAt === 'trackRecord') {
                        if (!record) {
                            console.log(`[Trigger] No track yet, first occurrence.`);
                            continue;
                        };
                        foundAtSource = record;
                    } else {
                        foundAtSource = log;
                    }
                    comparisonValue = this.getMappingValue(foundAtSource, condition.compare);
                }

                if (condition.propertyType) {
                    mainMapValue = castProperty(mainMapValue, condition.propertyType);
                    comparisonValue = castProperty(comparisonValue, condition.propertyType);
                }

                if (condition.propertyType === PropertyType.DATE && condition.applyOperationOnDate) {
                    try {
                        const a = mainMapValue as unknown as Date;
                        const b = comparisonValue as unknown as Date;

                        mainMapValue = extractDatePart(a, condition.applyOperationOnDate);
                        comparisonValue = extractDatePart(b, condition.applyOperationOnDate);
                    } catch (error) {
                        console.log(error);
                    }

                }

                switch (condition.conditionOperation) {
                    case ConditionOperation.EQUAL:
                        if (condition.oneOf) {
                            if (condition.oneOf.includes(String(mainMapValue))) continue;
                            return false;
                        }
                        if (String(mainMapValue) === String(comparisonValue)) continue;
                        return false;

                    case ConditionOperation.NOT_EQUAL:
                        if (String(mainMapValue) !== String(comparisonValue)) continue;
                        return false;

                    case ConditionOperation.GREATER_THAN:
                        if ((mainMapValue as number) > (comparisonValue as number)) continue;
                        return false;
                    case ConditionOperation.LESS_THAN:
                        if ((mainMapValue as number) < (comparisonValue as number)) continue;
                        return false;
                    case ConditionOperation.GREATER_OR_EQUAL:
                        if ((mainMapValue as number) >= (comparisonValue as number)) continue;
                        return false;
                    default:
                        continue
                }
            } catch (error) {
                return false;
            }
        }

        return true
    }

    private getMappingValue(log: any, specification: Partial<SearchSpec>): string {
        if (specification.foundAt) {
            let value = log[specification.foundAt]
            if (specification.mappedBy) return value[specification.mappedBy]
            return value
        }
        if (specification.mappedBy) {
            return log[specification.mappedBy]
        }
        throw new InternalServerErrorException(
            errorMessagePattern
                .game
                .trigger
                .invalidTriggerConditionConfiguration
                .fn(
                    'foundAtNotProvided'
                )
        )
    }
}
