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

                        mainMapValue = this.extractDatePart(a, condition.applyOperationOnDate);
                        comparisonValue = this.extractDatePart(b, condition.applyOperationOnDate);
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

    private extractDatePart(date: Date, part: DateConditionOperation): number {
        if (!date) {
            throw new InternalServerErrorException(
                errorMessagePattern
                    .game
                    .trigger
                    .invalidTriggerConditionConfiguration
                    .fn('dateNotProvided')
            );
        }

        switch (part) {
            case DateConditionOperation.YEAR:
                return date.getFullYear();
            case DateConditionOperation.MONTH:
                return date.getMonth() + 1;
            case DateConditionOperation.DAY:
                return date.getDate();
            case DateConditionOperation.HOUR:
                return date.getHours();
            case DateConditionOperation.MINUTE:
                return date.getMinutes();
            case DateConditionOperation.SECOND:
                return date.getSeconds();
            case DateConditionOperation.WEEK:
                const d = new Date(date.getTime());
                d.setHours(0, 0, 0, 0);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                const start = new Date(monday.getTime());
                const weekNum = Math.ceil((((date.getTime() - start.getTime()) / 86400000) + 1) / 7);
                return weekNum;
            default:
                return 0;
        }
    }
}
