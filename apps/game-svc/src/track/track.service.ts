import {
    errorMessagePattern,
    PropertyType,
    TrackConfiguration,
    TrackRecord,
    TrackTemplate,
    TrackType,
    UpdateOperation,
    castProperty,
    DateConditionOperation
} from "@backend-evolved/shared";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { extractDatePart } from "@backend-evolved/shared";

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
            case TrackType.STREAK:
                effectiveConfiguration.type = TrackType.STREAK;
                effectiveConfiguration.initialValue = initialValue || '1';
                effectiveConfiguration.updateValue = updateValue || undefined;
                effectiveConfiguration.trackPropertyType = PropertyType.NUMBER;
                effectiveConfiguration.updateOperation = UpdateOperation.ADD;
                const streakTrackHistory = this.trackTemplateRepository.create({
                    name: `${data.name} - Personal Best`,
                    description: `History of the best streak for track: ${data.name}`,
                    configuration: {
                        type: TrackType.HISTORY,
                        initialValue: '0',
                        trackPropertyType: PropertyType.NUMBER,
                        updateOperation: UpdateOperation.SET
                    } as TrackConfiguration
                });
                const savedStreakHistory = await this.trackTemplateRepository.save(streakTrackHistory, { reload: true });
                effectiveConfiguration.historyStreak = savedStreakHistory.id;
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
                }
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

    async findAllRecords(options?: { where: any }) {
        const { where } = options || {};
        return await this.trackRecordRepository.find({ where, relations: ['track'] });
    }

    async findOneRecord(options: { trackId: string, userId: string }) {
        const { trackId, userId } = options;
        const foundRecord = await this.trackRecordRepository.findOne({
            where: { trackId, userId },
            relations: ['track']
        });

        if (foundRecord) {
            const { configuration } = foundRecord.track;
            if (configuration.type === TrackType.STREAK) {
                const personalBest = await this.trackRecordRepository.findOne({
                    where: {
                        trackId: configuration.historyStreak,
                        userId
                    }
                });
                if (personalBest) {
                    (foundRecord as any).personalBest = personalBest.currentValue;
                }
            }
        }

        return foundRecord;
    }

    async updateOrCreate(trackRecord: TrackRecord, trackTemplate: TrackTemplate, log: any): Promise<TrackRecord> {
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

                    await this.trackRecordRepository.update(
                        { trackId: trackRecord.trackId, userId: trackRecord.userId },
                        { currentValue: newValue.toString() },
                    );

                    const foundUpdatedRecord = await this.findOneRecord({ trackId: trackRecord.trackId, userId: trackRecord.userId });
                    if(!foundUpdatedRecord) throw new InternalServerErrorException(
                        errorMessagePattern
                            .game
                            .track
                            .trackRecordFailedToBeFoundAfterUpdate
                            .fn()
                    );

                    return foundUpdatedRecord;


                case TrackType.STREAK:
                    const rawLastUpdate = castProperty<Date>(trackRecord.lastUpdatedAt, PropertyType.DATE);
                    const timestamp = castProperty<Date>(log.timestamp, PropertyType.DATE);

                    const lastUpdatedAt = extractDatePart(rawLastUpdate, DateConditionOperation.DAY);
                    const dayRequest = extractDatePart(timestamp, DateConditionOperation.DAY);

                    if (lastUpdatedAt + 1 === dayRequest) {
                        const currentStreak = castProperty<number>(trackRecord.currentValue, PropertyType.NUMBER);

                        await this.trackRecordRepository.update(
                            { trackId: trackRecord.trackId, userId: trackRecord.userId },
                            { currentValue: (currentStreak + 1).toString() }
                        );

                        const foundUpdatedRecord = await this.findOneRecord({ trackId: trackRecord.trackId, userId: trackRecord.userId });
                        if(!foundUpdatedRecord) throw new InternalServerErrorException(
                            errorMessagePattern
                                .game
                                .track
                                .trackRecordFailedToBeFoundAfterUpdate
                                .fn()
                        );
                    }

                    if (lastUpdatedAt <= dayRequest) {
                        await this.trackRecordRepository.update(
                            { trackId: trackRecord.trackId, userId: trackRecord.userId },
                            { currentValue: trackRecord.currentValue }
                        );

                        const foundUpdatedRecord = await this.findOneRecord({ trackId: trackRecord.trackId, userId: trackRecord.userId });
                        if(!foundUpdatedRecord) throw new InternalServerErrorException(
                            errorMessagePattern
                                .game
                                .track
                                .trackRecordFailedToBeFoundAfterUpdate
                                .fn()
                        );

                        return foundUpdatedRecord;
                    }

                    if (lastUpdatedAt + 1 > dayRequest) {
                        if (trackTemplate.configuration.historyStreak) {
                            const historyStreakTrack = await this.findOneRecord({
                                trackId: trackTemplate.configuration.historyStreak,
                                userId: log.user.id
                            });

                            if (historyStreakTrack) {
                                const currentStreak = castProperty<number>(trackRecord.currentValue, PropertyType.NUMBER);
                                const lastStreak = castProperty<number>(historyStreakTrack.currentValue, PropertyType.NUMBER);

                                if (currentStreak > lastStreak) {
                                    await this.trackRecordRepository.update(
                                        { trackId: historyStreakTrack.trackId, userId: log.user.id },
                                        { currentValue: trackRecord.currentValue }
                                    );
                                }
                            } else {
                                const newHistoryStreak = this.trackRecordRepository.create({
                                    trackId: trackTemplate.configuration.historyStreak,
                                    userId: log.user.id,
                                    currentValue: trackRecord.currentValue
                                });
                                await this.trackRecordRepository.save(newHistoryStreak, { reload: true });
                            }
                        }

                        await this.trackRecordRepository.update(
                            { trackId: trackRecord.trackId, userId: trackRecord.userId },
                            { currentValue: '1' }
                        );

                        const foundUpdatedRecord = await this.findOneRecord({ trackId: trackRecord.trackId, userId: trackRecord.userId });
                        if(!foundUpdatedRecord) throw new InternalServerErrorException(
                            errorMessagePattern
                                .game
                                .track
                                .trackRecordFailedToBeFoundAfterUpdate
                                .fn()
                        );

                        return foundUpdatedRecord;
                    }

                    break;
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