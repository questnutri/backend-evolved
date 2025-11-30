import { Body, Controller, Get, Post } from '@nestjs/common';
import { AchievementService } from './achievement.service';

@Controller('achievements')
export class AchievementController {
    constructor(private readonly achievementService: AchievementService) { }

    @Post()
    async createAchievement(
        @Body() body: any
    ) {
        return await this.achievementService.createTemplate(body);
    }

    @Get('all')
    async getAllAchievements() {
        return await this.achievementService.findAll();
    }
}