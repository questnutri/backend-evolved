import { AchievementFindOptions, AchievementRecord, AchievementTemplate, CreateAchievementDto, errorMessagePattern, UpdateAchievementDto } from '@backend-evolved/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
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

    async findAllUserAchievements(userId: string) {
        return await this.achievementRecordRepository.find({
            where: { userId },
            relations: ['achievement']
        });
    }

    async createTemplate(data: CreateAchievementDto) {
        await this.trackService.findOneTemplate({where: { id: data.trackId }});
        const achievement = this.achievementTemplateRepository.create(data);
        return await this.achievementTemplateRepository.save(achievement);
    }

    async findOneTemplate(options?: AchievementFindOptions) {
        const {where} = options || {};
        const achievement = await this.achievementTemplateRepository.findOne({ where });
        if(!achievement) throw new NotFoundException(errorMessagePattern.game.achievement.notFound.fn());
        return achievement;
    }

    async updateTemplate(achievement: AchievementTemplate, data: UpdateAchievementDto) {
        const updatedAchievement = this.achievementTemplateRepository.merge(achievement, data);
        return await this.achievementTemplateRepository.save(updatedAchievement);
    }

    async foundRecord(options?: any) {
        return await this.achievementRecordRepository.findOne(options);
    }

    async createRecord(data: Partial<AchievementRecord>): Promise<AchievementRecord> {
        const record = this.achievementRecordRepository.create(data);
        return await this.achievementRecordRepository.save(record);
    }

}