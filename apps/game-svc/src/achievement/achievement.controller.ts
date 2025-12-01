import { Body, Controller, Get, Param, Patch, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { ContextUser, ControllerExceptionFilter, CreateAchievementDto, JwtRoleGuard, UpdateAchievementDto } from '@backend-evolved/shared';

@Controller('achievements')
export class AchievementController {
    constructor(private readonly achievementService: AchievementService) { }

    @Post()
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async createAchievement(
        @Body() body: CreateAchievementDto
    ) {
        return await this.achievementService.createTemplate(body);
    }

    @Get('all')
    @UseGuards(JwtRoleGuard(['admin', 'nutritionist', 'patient']))
    @UseFilters(ControllerExceptionFilter)
    async getAllAchievements() {
        return await this.achievementService.findAll();
    }

    @Get('me')
    @UseGuards(JwtRoleGuard(['patient']))
    @UseFilters(ControllerExceptionFilter)
    async getMyAchievements(
        @ContextUser() ctxUser: ContextUser,
        @Query('completedOnly') completedOnly: boolean = false
    ) {
        const unlockedAchievements = await this.achievementService.findAllUserAchievements(ctxUser.id);
        const getAllAchievements = !completedOnly ? await this.achievementService.findAll() : [];

        if (completedOnly) {
            return unlockedAchievements;
        }
        return getAllAchievements.map(achievement => {
            const unlockedAchievement = unlockedAchievements.find(unlocked => unlocked.achievementId === achievement.id);
            if (!unlockedAchievement) {
                return {
                    ...achievement,
                    unlockedAt: null
                };
            }
            return {
                ...achievement,
                unlockedAt: unlockedAchievement.unlockedAt
            };
        });
    }

    @Patch(':achievementId')
    @UseGuards(JwtRoleGuard(['admin']))
    @UseFilters(ControllerExceptionFilter)
    async updateAchievement(
        @Param('achievementId') achievementId: string,
        @Body() body: UpdateAchievementDto
    ) {
        const foundAchievement = await this.achievementService.findOneTemplate({ where: { id: achievementId } });
        return await this.achievementService.updateTemplate(foundAchievement, body);
    }


}