import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrackRecord } from "@backend-evolved/shared";
import { TrackTemplateService } from "./track-template.service";

@Injectable()
export class TrackRecordService {
    constructor(
        @InjectRepository(TrackRecord)
        private trackRecordRepository: Repository<TrackRecord>,
        private trackTemplateService: TrackTemplateService
    ) { }

    async findOne({ trackId, userId }: { trackId: string, userId: string }): Promise<TrackRecord | null> {
        return await this.trackRecordRepository.findOne({ where: { trackId, userId }, relations: ['track'] });
    }

    async createOrUpdate(trackId: string, log: any): Promise<TrackRecord> {
        const template = await this.trackTemplateService.findOne(trackId);

        let existingTrack = await this.trackRecordRepository.findOne({ where: { trackId, userId: log.user.id }, relations: ['track'] });

        if (existingTrack) {
            existingTrack.updateValue(log);
            return await this.trackRecordRepository.save(existingTrack);
        }

        const newTrack = this.trackRecordRepository.create({
            trackId,
            userId: log.user.id,
            track: template,
            currentValue: template.configuration.initialValue
        });
        return await this.trackRecordRepository.save(newTrack);
    }
}