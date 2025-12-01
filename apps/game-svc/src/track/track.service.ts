import {
    errorMessagePattern,
    PropertyType,
    TrackConfiguration,
    TrackRecord,
    TrackTemplate,
    TrackType,
    UpdateOperation,
    castProperty
} from "@backend-evolved/shared";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class TrackService {
    constructor(
        @InjectRepository(TrackTemplate)
        private readonly trackTemplateRepository: Repository<TrackTemplate>,
        @InjectRepository(TrackRecord)
        private readonly trackRecordRepository: Repository<TrackRecord>
    ) { }

    async findAllTemplates() {
        return await this.trackTemplateRepository.find();
    }

    async findOneTemplate(options?: any): Promise<TrackTemplate> {
        const { where, relations } = options || {};
        const foundTemplate = await this.trackTemplateRepository.findOne({ where, relations });
        if (!foundTemplate) {
            throw new BadRequestException(
                errorMessagePattern
                    .game
                    .track
                    .templateNotFound
                    .fn()
            );
        }
        return foundTemplate;
    }

    async createTemplate(data: Partial<TrackTemplate>) {
        const { configuration } = data;
        let {
            type,
            updateOperation,
            trackPropertyType,
            initialValue,
            directValue,
            updateValue,
            computedValue
        } = configuration || {};
        const effectiveConfiguration: Partial<TrackConfiguration> = {};

        switch (type) {
            case TrackType.PROPERTY:
                effectiveConfiguration.type = TrackType.PROPERTY;
                effectiveConfiguration.trackPropertyType = trackPropertyType || PropertyType.STRING;
                effectiveConfiguration.initialValue = initialValue || undefined;
                effectiveConfiguration.updateOperation = updateOperation || UpdateOperation.SET;
                effectiveConfiguration.directValue = directValue || undefined;
                effectiveConfiguration.updateValue = updateValue || undefined;
                effectiveConfiguration.computedValue = computedValue || undefined;
                break;
            default:
                effectiveConfiguration.type = TrackType.COUNTER;
                const allowedOperations = [UpdateOperation.ADD, UpdateOperation.SUB];
                if (updateOperation && !allowedOperations.includes(updateOperation)) {
                    throw new BadRequestException(
                        errorMessagePattern
                            .game
                            .track
                            .invalidUpdateOperation
                            .fn({
                                operation: UpdateOperation.SET,
                                type: TrackType.COUNTER,
                                allowedOperations
                            })
                    )
                };
                effectiveConfiguration.updateOperation = updateOperation || allowedOperations.at(0);
                effectiveConfiguration.trackPropertyType = PropertyType.NUMBER;
                effectiveConfiguration.initialValue = initialValue || '1';
                effectiveConfiguration.updateValue = updateValue || '1';
                break;
        }

        const createdTrack = this.trackTemplateRepository.create({
            ...data,
            configuration: effectiveConfiguration as TrackConfiguration
        });
        return await this.trackTemplateRepository.save(createdTrack, { reload: true });
    }

    async findAllRecords(options?: {
        where: any
    }) {
        const { where } = options || {};
        return await this.trackRecordRepository.find({ where, relations: ['track'] });
    }

    async findOneRecord(options: {
        trackId: string,
        userId: string
    }) {
        const { trackId, userId } = options;
        return await this.trackRecordRepository.findOne({
            where: {
                trackId,
                userId
            },
            relations: ['track']
        });
    }

    async updateOrCreate(
        trackRecord: TrackRecord,
        trackTemplate: TrackTemplate,
        log: any,
    ) {
        if (trackRecord) {
            switch (trackRecord.track.configuration.type) {
                case TrackType.COUNTER:
                    const currentValue = castProperty<number>(trackRecord.currentValue, PropertyType.NUMBER);
                    const updateValue = castProperty<number>(trackRecord.track.configuration.updateValue, PropertyType.NUMBER);
                    let newValue: number;
                    switch (trackRecord.track.configuration.updateOperation) {
                        case UpdateOperation.ADD:
                            newValue = currentValue + updateValue;
                            break;
                        case UpdateOperation.SUB:
                            newValue = currentValue - updateValue;
                            break;
                        default:
                            newValue = currentValue;
                            break;
                    }
                    trackRecord.currentValue = newValue.toString();
                    await this.trackRecordRepository.save(trackRecord, { reload: true });
                    return trackRecord;
            }
        }
        const newRecord = this.trackRecordRepository.create({
            trackId: trackTemplate.id,
            userId: log.user.id,
            currentValue: trackTemplate.configuration.initialValue
        });
        return await this.trackRecordRepository.save(newRecord, { reload: true });

    }

}