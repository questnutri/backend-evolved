import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import type { i18n } from "../../../interfaces";
import { AchievementTemplateInfo } from "./achievement-template-info.dto";

export class CreateAchievementDto {
    @ApiProperty({
        example: 'track-uuid-5678',
        description: 'The unique identifier of the track that this achievement is associated with',
        required: true
    })
    @IsNotEmpty()
    @IsUUID()
    trackId: string;

    @ApiProperty({
        example: "1",
        description: 'The target value that needs to be reached to unlock this achievement',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    targetValue: string;

    @ApiProperty({
        description: 'The internationalized information for the achievement template',
        required: true
    })
    @IsNotEmpty()
    i18n: i18n<AchievementTemplateInfo>
}