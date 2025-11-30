import { AchievementRecord, AchievementTemplate } from '@backend-evolved/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackService } from '../track/track.service';

@Injectable()
export class AchievementService {
    constructor(
        @InjectRepository(AchievementTemplate)
        private readonly achievementTemplateRepository: Repository<AchievementTemplate>,
        @InjectRepository(AchievementRecord)
        private readonly achievementRecordRepository: Repository<AchievementRecord>,
        private readonly trackService: TrackService,
    ) {}

    async findAll() {
        return await this.achievementTemplateRepository.find();
    }

    async createTemplate(data: any) {
        await this.trackService.findOneTemplate({where: { id: data.trackId }});
        const achievement = this.achievementTemplateRepository.create(data);
        return await this.achievementTemplateRepository.save(achievement);
    }

    async foundRecord(options?: any) {
        return await this.achievementRecordRepository.findOne(options);
    }

    async createRecord(data: any) {
        const record = this.achievementRecordRepository.create(data);
        return await this.achievementRecordRepository.save(record);
    }
}