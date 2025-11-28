import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrackRecord } from "@backend-evolved/shared";
import { TrackService } from "./track.service";

@Injectable()
export class TrackRecordService {
    constructor(
        @InjectRepository(TrackRecord)
        private trackRecordRepository: Repository<TrackRecord>,
        private readonly trackService: TrackService
    ) {}

    async createOrUpdate(trackId: string, userId: string, value: any): Promise<TrackRecord> {
        const track = await this.trackService.findOne(trackId);

        let trackRecord = await this.trackRecordRepository.findOne({ where: { trackId, userId } });

        if (trackRecord) {
            trackRecord.currentValue = value;
        } else {
            trackRecord = this.trackRecordRepository.create({
                trackId,
                userId,
                currentValue: value,
                track,
            });
        }

        return await this.trackRecordRepository.save(trackRecord);
    }
}