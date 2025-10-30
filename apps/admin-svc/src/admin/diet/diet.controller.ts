import { Body, Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { DietService } from './diet.service';
import { JwtRoleGuard } from '../../../../../libs/shared/src/guards';
import { DietRequestBody } from '../../../../../libs/shared/src/dto';
import { DietManagementLevel, NutritionistManagementLevel } from '../../../../../libs/shared/src/entities';
import { ManagementGuard } from '../../guards/management.guard';
import { ControllerExceptionFilter } from '../../../../../libs/shared/src/filters';

@Controller('diet')
export class DietController {
    constructor(private readonly dietService: DietService) { }

    @Get()
    @UseGuards(
        JwtRoleGuard(['admin']),
        ManagementGuard(DietManagementLevel, "canViewDiets")
    )
    @UseFilters(ControllerExceptionFilter)
    async getAllDiets(
        @Body() body: DietRequestBody,
    ) {
        return await this.dietService.getAll(body.patientId, body.nutritionistId);
    }

}
