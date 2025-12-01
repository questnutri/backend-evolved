import { OmitType } from "@nestjs/swagger";
import { CreateAchievementDto } from "./create-achievement.dto";

export class UpdateAchievementDto extends OmitType(CreateAchievementDto, ['trackId', 'targetValue']) {}