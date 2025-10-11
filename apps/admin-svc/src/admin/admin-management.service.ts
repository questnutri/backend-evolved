import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    AdminManagementLevel,
    NutritionistManagementLevel,
    PatientManagementLevel,
    DietManagementLevel,
    RecordManagementLevel,
    GameManagementLevel,
    LogManagementLevel
} from "@backend-evolved/shared";

@Injectable()
export class ManagementLevelService {
    constructor(
        @InjectRepository(AdminManagementLevel) private adminManagementLevelRepository: Repository<AdminManagementLevel>,
        @InjectRepository(NutritionistManagementLevel) private nutritionistManagementLevelRepository: Repository<NutritionistManagementLevel>,
        @InjectRepository(PatientManagementLevel) private patientManagementLevelRepository: Repository<PatientManagementLevel>,
        @InjectRepository(DietManagementLevel) private dietManagementLevelRepository: Repository<DietManagementLevel>,
        @InjectRepository(RecordManagementLevel) private recordManagementLevelRepository: Repository<RecordManagementLevel>,
        @InjectRepository(GameManagementLevel) private gameManagementLevelRepository: Repository<GameManagementLevel>,
        @InjectRepository(LogManagementLevel) private logManagementLevelRepository: Repository<LogManagementLevel>,
    ) { }

    async createManagementLevels(id: string) {
        try {
            await this.adminManagementLevelRepository.manager.transaction(async (manager) => {
                const adminManagementLevel = this.adminManagementLevelRepository.create({ id });
                await manager.save(adminManagementLevel);

                const nutritionistManagementLevel = this.nutritionistManagementLevelRepository.create({ id });
                await manager.save(nutritionistManagementLevel);

                const patientManagementLevel = this.patientManagementLevelRepository.create({ id });
                await manager.save(patientManagementLevel);

                const dietManagementLevel = this.dietManagementLevelRepository.create({ id });
                await manager.save(dietManagementLevel);

                const recordManagementLevel = this.recordManagementLevelRepository.create({ id });
                await manager.save(recordManagementLevel);

                const gameManagementLevel = this.gameManagementLevelRepository.create({ id });
                await manager.save(gameManagementLevel);

                const logManagementLevel = this.logManagementLevelRepository.create({ id });
                await manager.save(logManagementLevel);
            });
        } catch (error: any) {
            throw new InternalServerErrorException('Failed to create management levels', error?.message ?? error);
        }
    }
}