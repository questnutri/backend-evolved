import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import jsonLogic from "json-logic-js";
import { CounterTrackConfig, CustomExpressionTrackConfig, PropertyValueTrackConfig, TrackConfig, TrackEntity, TrackRecord, TrackType } from "@backend-evolved/shared";

@Injectable()
export class TrackService {
    constructor(
        @InjectRepository(TrackEntity)
        private trackTemplateRepository: Repository<TrackEntity>,
        @InjectRepository(TrackRecord)
        private trackRecordRepository: Repository<TrackRecord>,
    ) { }

    async create(data: {
        name: string
        type: TrackType
        config: TrackConfig
    }) {
        const track = this.trackTemplateRepository.create(data)
        return this.trackTemplateRepository.save(track)
    }

    async findAll() {
        return this.trackTemplateRepository.find()
    }

    async findOne(id: string) {
        const track = await this.trackTemplateRepository.findOne({ where: { id } })
        if (!track) throw new NotFoundException("track not found")
        return track
    }

    async update(id: string, data: Partial<TrackEntity>) {
        const track = await this.findOne(id)
        Object.assign(track, data)
        return this.trackTemplateRepository.save(track)
    }

    async remove(id: string) {
        const track = await this.findOne(id)
        await this.trackTemplateRepository.remove(track)
        return { deleted: true }
    }

    evaluateTrackCondition(config: TrackConfig, eventData: Record<string, any>) {
        if ("conditionRule" in config && config.conditionRule) {
            return jsonLogic.apply(config.conditionRule, eventData)
        }
        return true
    }

    async processEvent(trackId: string, eventData: Record<string, any>) {
        const track = await this.findOne(trackId)
        if (!track.config) return

        const passes = this.evaluateTrackCondition(track.config, eventData)
        if (!passes) return

        if (track.type === TrackType.COUNTER) {
            const cfg = track.config as CounterTrackConfig
            return {
                increment: cfg.incrementValue ?? 1,
                uniquenessKey: cfg.uniquenessKey ?? null,
                groupingPeriod: cfg.groupingPeriod ?? "NONE"
            }
        }

        if (track.type === TrackType.PROPERTY_VALUE) {
            const cfg = track.config as PropertyValueTrackConfig
            const value = cfg.path.split(".").reduce(
                (acc, k) => (acc ? acc[k] : undefined),
                eventData
            )
            return {
                value,
                aggregation: cfg.aggregation,
                groupingPeriod: cfg.groupingPeriod ?? "NONE"
            }
        }

        if (track.type === TrackType.CUSTOM_EXPRESSION) {
            const cfg = track.config as CustomExpressionTrackConfig
            const fn = new Function("data", `return ${cfg.expression}`)
            return fn(eventData)
        }
    }
}
